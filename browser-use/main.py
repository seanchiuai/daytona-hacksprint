import argparse
import asyncio
import os

from dotenv import load_dotenv

from browser_use import Agent, Browser, ChatOpenAI, Tools

load_dotenv()


def parse_user_context(context_path: str) -> dict:
    """
    Parse user_context.txt and extract relevant information.
    """
    with open(context_path, 'r') as f:
        content = f.read()

    # Extract key information from the context
    context_info = {
        "email": "seanlockedin430@gmail.com",
        "password": "Shirleyhsu670$",
        "first_name": "John",
        "last_name": "Doe",
        "age": 17,
        "colleges": ["Stanford", "Harvard"],
        "first_generation": True,
        "honors_college": False,
        "application_term": "Fall 2026",
        "criminal_history": False,
        "academic_disciplinary_history": False,
        "legal_disciplinary_history": False,
        "military_service": False,
        "military_relatives": False,
        "citizenship_status": "US Permanent Resident",
        "has_green_card": True,
        "arts_portfolio": False,
        "birth_country": "United States",
        "birth_state": "Idaho",
        "lived_outside_us": False,
        "parents_attended_stanford": False,
        "parents_employed_stanford": False,
        "relatives_employed_stanford": False,
        "parents_separate_address": False,
        "siblings": 1,
        "siblings_applying_to_college": False,
        "full_context": content
    }

    return context_info


async def fill_common_app(context_info: dict):
    """
    Automate CommonApp login, college search, adding colleges, and filling out all forms.
    """

    # Use GPT-4 for complex form filling tasks
    llm = ChatOpenAI(model="gpt-4o")

    tools = Tools()

    # Enable cross-origin iframe support for embedded application forms
    browser = Browser(cross_origin_iframes=True)

    colleges_list = ", ".join(context_info['colleges'])

    task = f"""
Your goal is to complete the ENTIRE Common Application process for the user. This is a multi-stage task:

**USER CONTEXT:**
{context_info['full_context']}

**STAGE 1: LOGIN**
1. Navigate to https://apply.commonapp.org/login
2. Log in using:
   - Email: {context_info['email']}
   - Password: {context_info['password']}
3. Close any welcome popups or tours that appear after login

**STAGE 2: ADD COLLEGES**
CRITICAL: DO NOT click any "Remove" or "Cancel" buttons during this stage. Only click "Add School" buttons.

1. Navigate to the "College Search" or "Search" tab/section

2. ADD STANFORD:
   a. Click on the search bar/input field
   b. Type "Stanford" into the search bar
   c. Wait for search results to appear
   d. Find Stanford University in the results
   e. Click the "Add School" button for Stanford
   f. Wait for confirmation that Stanford was added
   g. Click back into the search bar and DELETE "Stanford" from the search bar (clear it completely)

3. ADD HARVARD:
   a. With the search bar now cleared, type "Harvard" into the search bar
   b. Wait for search results to appear
   c. Find Harvard University in the results
   d. Click the "Add School" button for Harvard
   e. Wait for confirmation that Harvard was added

4. Navigate to "My Colleges" tab

IMPORTANT: If you see a "Remove" button, IGNORE IT. Never click Remove or Cancel buttons.

**STAGE 3: FILL OUT COLLEGE-SPECIFIC FORMS**

YOU MUST COMPLETE ONE COLLEGE ENTIRELY BEFORE MOVING TO THE NEXT.

1. In the "My Colleges" tab, you should see Stanford and Harvard

2. COMPLETE STANFORD FIRST:
   a. Click on "Stanford" to open its application
   b. Go through EVERY available tab/section/category (Questions, Writing, Family, Education, Testing, Activities, etc.)
   c. For EACH section, fill in ALL questions you can answer based on USER CONTEXT
   d. If you cannot answer a question from the context, SKIP it and move to the next question
   e. Save progress after completing each section/category
   f. Do NOT move to Harvard until you have gone through ALL sections for Stanford
   g. After completing ALL Stanford sections, return to "My Colleges"

3. THEN COMPLETE HARVARD:
   a. Click on "Harvard" to open its application
   b. Go through EVERY available tab/section/category (Questions, Writing, Family, Education, Testing, Activities, etc.)
   c. For EACH section, fill in ALL questions you can answer based on USER CONTEXT
   d. If you cannot answer a question from the context, SKIP it and move to the next question
   e. Save progress after completing each section/category
   f. After completing ALL Harvard sections, you are done

**IMPORTANT INSTRUCTIONS:**
- Work methodically through each stage - do not skip stages
- NEVER click "Remove" or "Cancel" buttons when adding colleges
- Once a college is added, immediately move on to the next college search
- Read each question carefully before answering
- Use ONLY information from the USER CONTEXT provided above
- If a question is unclear or you don't have the information, SKIP it - do not guess
- If you encounter dropdowns, select the option that best matches the context
- For yes/no questions, use the context to determine the correct answer
- Save your work frequently after completing each section
- If you encounter errors or popups, handle them gracefully and continue
- Do not submit any applications - only fill out the forms
- Focus on one field at a time, scrolling to make it visible before interacting
- In "My Colleges" section, work on one college at a time completely before moving to the next

**COMPLETION:**
- You are done when you have gone through ALL colleges and filled out ALL available sections for each
- Use the done action when complete
- Provide a detailed summary of:
  1. Which colleges were added successfully
  2. Which sections were completed for each college
  3. Any questions that were skipped and why
  4. Any errors or issues encountered
"""

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        tools=tools,
    )

    history = await agent.run()

    return history.final_result()


async def main(context_path: str):
    # Verify context file exists
    if not os.path.exists(context_path):
        raise FileNotFoundError(f"User context file not found: {context_path}")

    # Parse user context
    context_info = parse_user_context(context_path)

    print(f"\n{'=' * 60}")
    print("Starting CommonApp Automation")
    print(f"{'=' * 60}")
    print(f"User: {context_info['first_name']} {context_info['last_name']}")
    print(f"Email: {context_info['email']}")
    print(f"Colleges to apply: {', '.join(context_info['colleges'])}")
    print(f"Application Term: {context_info['application_term']}")
    print(f"{'=' * 60}\n")

    # Run the automation
    result = await fill_common_app(context_info)

    # Display results
    print(f"\n{'=' * 60}")
    print("Automation Result")
    print(f"{'=' * 60}")
    print(result)
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Automated CommonApp form filler using user context",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use default user_context.txt
  python main.py

  # Use custom context file
  python main.py --context my_context.txt
        """,
    )
    parser.add_argument(
        "--context",
        default="user_context.txt",
        help="Path to user context file (default: user_context.txt)",
    )

    args = parser.parse_args()

    asyncio.run(main(args.context))
