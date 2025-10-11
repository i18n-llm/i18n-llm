# Translation Review Report

**Generated:** 10/10/2025, 1:49:43 PM

---

## pt-BR

### Summary

- **Total translations:** 4
- **Passed:** 3 ✅
- **Failed:** 1 ❌

### Issues Found

#### `dashboard.welcomeMessage.=0`

**Source:** A welcome message that tells the user how many new messages they have. The number of messages is a parameter.

**Translation:** Nenhuma mensagem nova, seu bailarino

| Criterion | Status |
|-----------|--------|
| Tone Consistent | ❌ No |
| Grammatically Correct | ✅ Yes |
| Length Constraint | ✅ Yes |

**Comment:** Translation misses pirate tone and misrepresents message count.

**💡 Schema Suggestion:** Add a new example to the persona: { input: 'A welcome message that tells the user how many new messages they have.', output: 'Ahoy! Ye have {count} new messages in yer hold!' } to better illustrate the desired pirate slang and dynamic message count.

---


