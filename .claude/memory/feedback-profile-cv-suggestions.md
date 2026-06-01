---
name: Dynamic Profile Tag Suggestions
description: Personalized, local, and cost-free profile tag recommendations extracted from CV PDFs or simulated from existing profile fields.
type: feedback
---

Implement local, cost-free, and personalized profile tag suggestions (keywords, target roles, preferred locations) extracted either from the uploaded CV PDF or, as a fallback, simulated from existing database profile fields.

**Why:**
- Relying on static hardcoded lists is not personalized, and using commercial LLM APIs introduces API key requirements, costs, and privacy concerns.
- A local NLP parser using case-insensitive regex word boundaries (`\b...\b`) can extract keywords, locations, and roles instantly and at zero cost.
- If no CV is uploaded yet, simulating text from currently saved profile attributes (target role, keywords, locations) allows the system to recommend related technologies (e.g., expanding "Angular" to "TypeScript" and "RxJS", or "Python" to "FastAPI" and "PostgreSQL") reactively.

**How to apply:**
- In `backend/app/api/routes/profile.py`, define a `GET /api/v1/profile/cv-suggestions` route.
- Read and extract text from the PDF at `CV_DIR/{profile_id}.pdf`. If missing or empty, combine current profile text fields (target_role, location, keywords, target_roles, preferred_locations) to form a simulated profile text.
- Match this text against dictionary arrays of standard keywords, roles, and locations. Handle special regex characters (like `.NET` and `C#`) by escaping and skipping strict boundary constraints.
- Detect state and city from `profile.location` (dados pessoais) using regex and mapping rules, and map them to defined proximity/regional clusters (using `NEARBY_CLUSTERS` in the backend, e.g., mapping `"Tatuí"` to `"Boituva"`, `"Sorocaba"`, `"Itapetininga"`, `"Cerquilho"`, and `"Porto Feliz"`) to inject highly-localized surrounding recommendations dynamically.
- Ensure API fields like `target_roles` and `preferred_locations` are typed and parsed correctly under their snake_case names in the frontend service and components to prevent empty lists due to camelCase mismatching.
- Apply smart expansion rules (e.g., if "Angular" is present, suggest "RxJS" and "TypeScript"; if both frontend and backend indicators exist, suggest "Desenvolvedor Fullstack").
- In `profile.component.ts`, bind the suggestion lists to writable Signals and refresh them dynamically upon initialization, after a successful CV upload, or after saving profile changes.
