// ============================================
// features/leetcodeLink.js
// LeetCode problem matching and link injection
// ============================================

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

/**
 * Check if current page is an assignment problem page
 */
function isAssignmentProblemPage() {
  return (
    (location.pathname.includes("/assignment/problems/") ||
      location.pathname.includes("/homework/problems")) &&
    location.pathname.match(/\/problems\/\d+/)
  );
}

/**
 * Extract problem title from the page
 */
function extractProblemTitle() {
  let rawTitle = null;

  // Strategy 1: Specific Class (Priority) - cr-p-heading__text
  const specificSelectors = [
    ".cr-p-heading__text span",
    ".cr-p-heading__text",
    '[class*="heading__text"]',
    '[class*="heading_text"]',
  ];

  for (const sel of specificSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      rawTitle = el.innerText;
      break;
    }
  }

  // Strategy 2: H1 fallback
  if (!rawTitle) {
    const h1 = document.querySelector("h1");
    if (h1) {
      rawTitle = h1.innerText;
    }
  }

  if (rawTitle) {
    // CLEANUP logic
    let clean = rawTitle
      .replace(/^Q\d+\.\s*/i, "") // Remove Q1., Q2., etc.
      .replace(/<\/?>/g, "") // Remove tags
      .replace(/\bSolved\b/gi, "")
      .replace(/\bUnsolved\b/gi, "")
      .replace(/\s-\sProblem$/i, "") // Remove " - Problem"
      .replace(/\sProblem$/i, "")
      .trim();

    clean = clean.split("\n")[0].trim();
    return clean;
  }

  return null;
}

/**
 * Check LeetCode GraphQL for problem match
 */
async function checkLeetCodeGraphQL(title) {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        questions: data {
          title
          titleSlug
        }
      }
    }
  `;

  const variables = {
    categorySlug: "",
    limit: 5,
    skip: 0,
    filters: { searchKeywords: title },
  };

  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) return { found: false };

    const data = await response.json();
    const questions = data.data?.problemsetQuestionList?.questions || [];

    // Strict check for LeetCode internal search
    const target = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const match = questions.find((q) => {
      const qTitle = q.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        qTitle === target ||
        (qTitle.includes(target) && Math.abs(qTitle.length - target.length) < 5)
      );
    });

    if (match) {
      return {
        found: true,
        url: `https://leetcode.com/problems/${match.titleSlug}/`,
        title: match.title,
      };
    }
  } catch (e) {
    console.error("[Scaler++] LeetCode GraphQL search failed:", e);
  }

  return { found: false };
}

/**
 * Check Google Search for LeetCode problem
 */
async function checkGoogleSearch(title) {
  const query = encodeURIComponent(`${title} site:leetcode.com/problems`);
  const searchUrl = `https://www.google.com/search?q=${query}`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) throw new Error("Google Search Failed");

    const text = await response.text();

    // Find LeetCode problem URLs
    const regex = /https:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\//g;
    let match = regex.exec(text);

    if (match && match[0]) {
      const url = match[0];
      const slug = match[1];

      // VERIFICATION STEP
      const verified = await verifyProblemMatch(slug, title);

      if (verified.valid) {
        return {
          found: true,
          url: url,
          title: verified.title,
        };
      }
    }
  } catch (e) {
    console.error("[Scaler++] Google search failed:", e);
  }

  return { found: false, url: null };
}

/**
 * Verify if the problem slug matches the title
 */
async function verifyProblemMatch(slug, userTitle) {
  const query = `
    query questionTitle($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { titleSlug: slug } }),
    });

    const data = await response.json();
    const question = data.data?.question;

    if (question && question.title) {
      const leetCodeTitle = question.title;
      if (isTitleSimilar(userTitle, leetCodeTitle)) {
        return { valid: true, title: leetCodeTitle };
      }
    }
  } catch (e) {
    console.error("[Scaler++] LeetCode verification failed:", e);
  }

  return { valid: false, title: null };
}

/**
 * Get cached LeetCode problem result
 */
async function getCachedLeetCodeResult(title) {
  try {
    const cacheKey = `leetcode_cache_${normalizeTitleForCache(title)}`;
    const result = await chrome.storage.local.get(cacheKey);

    if (result[cacheKey]) {
      const cached = result[cacheKey];

      // Check if cache is still valid (30 days)
      const CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
      const now = Date.now();

      if (cached.timestamp && now - cached.timestamp < CACHE_EXPIRY) {
        return {
          found: true,
          url: cached.url,
          title: cached.title,
          fromCache: true,
        };
      } else {
        // Cache expired, remove it
        await chrome.storage.local.remove(cacheKey);
      }
    }

    return null;
  } catch (e) {
    console.error("[Scaler++] Error reading cache:", e);
    return null;
  }
}

/**
 * Save LeetCode problem result to cache
 */
async function cacheLeetCodeResult(title, url, leetcodeTitle) {
  try {
    const cacheKey = `leetcode_cache_${normalizeTitleForCache(title)}`;
    const cacheData = {
      url: url,
      title: leetcodeTitle,
      timestamp: Date.now(),
    };

    await chrome.storage.local.set({ [cacheKey]: cacheData });
  } catch (e) {
    console.error("[Scaler++] Error saving to cache:", e);
  }
}

/**
 * Search for LeetCode problem via background script (avoids CORS)
 * Checks cache first for instant results!
 */
async function searchLeetCodeProblem(title) {
  try {
    // Check cache first
    const cachedResult = await getCachedLeetCodeResult(title);
    if (cachedResult) {
      return cachedResult;
    }

    // Not in cache, search via background script
    const response = await chrome.runtime.sendMessage({
      action: "searchLeetCodeProblem",
      title: title,
    });

    // Cache the result if found
    if (response.found && response.url) {
      await cacheLeetCodeResult(title, response.url, response.title);
    }

    return response;
  } catch (e) {
    console.error(
      "[Scaler++] Failed to communicate with background script:",
      e,
    );
    return { found: false, error: e.message };
  }
}

/**
 * Inject LeetCode link next to problem title
 */
function injectLeetCodeLink(leetcodeUrl) {
  // Find the target div (cr-p-heading__text)
  const headingTextDiv = document.querySelector(".cr-p-heading__text");

  if (!headingTextDiv) {
    return;
  }

  // Check if already injected
  if (headingTextDiv.querySelector(".scaler-leetcode-link")) {
    return;
  }

  // Create the LeetCode link container
  const linkContainer = document.createElement("a");
  linkContainer.href = leetcodeUrl;
  linkContainer.target = "_blank";
  linkContainer.className = "scaler-leetcode-link";
  linkContainer.style.marginLeft = "12px";
  linkContainer.style.display = "inline-flex";
  linkContainer.style.alignItems = "center";
  linkContainer.style.gap = "6px";
  linkContainer.style.padding = "4px 10px";
  linkContainer.style.backgroundColor = "#ffefd6ff";
  linkContainer.style.borderRadius = "6px";
  linkContainer.style.textDecoration = "none";
  linkContainer.style.transition = "all 0.2s ease";
  linkContainer.title = "View on LeetCode";

  // LeetCode icon
  const leetcodeIcon = document.createElement("img");
  leetcodeIcon.src = chrome.runtime.getURL("icons/leetcode_icon.png");
  leetcodeIcon.alt = "LeetCode";
  leetcodeIcon.style.width = "16px";
  leetcodeIcon.style.height = "16px";
  leetcodeIcon.style.objectFit = "contain";

  // External link icon
  const externalIcon = document.createElement("span");
  externalIcon.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16">
  <path d="M 18 5 L 18 7 L 23.5625 7 L 11.28125 19.28125 L 12.71875 20.71875 L 25 8.4375 L 25 14 L 27 14 L 27 5 Z M 5 9 L 5 27 L 23 27 L 23 14 L 21 16 L 21 25 L 7 25 L 7 11 L 16 11 L 18 9 Z"/>
</svg>
`;
  externalIcon.alt = "External Link";
  externalIcon.style.width = "16px";
  externalIcon.style.height = "16px";
  externalIcon.style.objectFit = "contain";

  linkContainer.appendChild(leetcodeIcon);
  linkContainer.appendChild(externalIcon);

  // Add hover effect
  linkContainer.addEventListener("mouseenter", () => {
    linkContainer.style.backgroundColor = "#fcb84bff";
    linkContainer.style.transform = "translateY(-2px) scale(1.02)";
    linkContainer.style.boxShadow = "0 4px 12px rgba(252, 184, 75, 0.3)";
  });

  linkContainer.addEventListener("mouseleave", () => {
    linkContainer.style.backgroundColor = "#ffefd6ff";
    linkContainer.style.transform = "translateY(0) scale(1)";
    linkContainer.style.boxShadow = "none";
  });

  // Append to the heading div
  headingTextDiv.appendChild(linkContainer);
}

/**
 * Initialize LeetCode link feature
 */
async function initLeetCodeLink() {
  if (!isAssignmentProblemPage()) {
    return;
  }

  // Check if the feature is enabled in settings
  if (!shouldHide("leetcode-link")) {
    // Remove existing link if feature is disabled
    const existingLink = document.querySelector(".scaler-leetcode-link");
    if (existingLink) {
      existingLink.remove();
    }
    return;
  }

  // Check if LeetCode link is already injected - avoid duplicate searches
  const headingTextDiv = document.querySelector(".cr-p-heading__text");
  if (headingTextDiv && headingTextDiv.querySelector(".scaler-leetcode-link")) {
    // Already injected, skip search
    return;
  }

  // Wait for the page to fully load
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const problemTitle = extractProblemTitle();

  if (!problemTitle) {
    return;
  }

  const result = await searchLeetCodeProblem(problemTitle);

  if (result.found && result.url) {
    injectLeetCodeLink(result.url);
  }
}
