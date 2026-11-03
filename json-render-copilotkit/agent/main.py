# #region genui - The agent fetches facts; the UI tool composes a granular catalog.
import os
from copilotkit import CopilotKitMiddleware
from langchain.agents import create_agent
from src.get_apartments import get_apartments
from src.generate_ui import generate_ui

agent = create_agent(
    model="openai:" + os.getenv("MODEL", "gpt-4.1"),
    tools=[get_apartments, generate_ui],
    middleware=[CopilotKitMiddleware()],
    system_prompt="""Help users search, compare and inspect synthetic apartments and try demo tour requests.
Always fetch records with get_apartments before presenting facts. Use apartment_ids for details or comparisons.
Respect all filters together; use exact min_bedrooms=max_bedrooms for an exact bedroom count.
Show at most twelve records, normally three to six. Preserve the search filters when returning to results.
Use generate_ui with the fetched records and a concise description of the requested view.
The UI tool has granular layout, content and field components; do not request prebuilt ApartmentCard, DetailView or TourForm components.
Search: compose listing content and separate View Details / Schedule Tour actions per record.
Comparison: present the same criteria for each apartment, including base rent, mandatory monthly total, pets, space and transit.
Details: include a gallery, summary, cost breakdown, lease/availability, amenities, transit and reviews.
Forms: request individual fields. Name, email and date are required by default; phone and message are optional unless the user specifies otherwise. Include a native submit button and Back to Results.
After 'Confirm my demo tour request for apartment ...', compose an honest demo confirmation using the supplied values.
Never claim a real booking, contact with a landlord or promised follow-up. Unknown values remain unknown.
After generate_ui, give one brief sentence; do not echo the generated spec.""",
)
graph = agent
# #endregion genui
