# The Connection (real AI starter)

A small Dutch group chat website with a name-entry screen and three fictional AI characters (Noah, Mila, Jay). This starter uses a server-side OpenAI API key.


## Run locally
1. Install Node.js 18+.
2. In this folder run: `npm install`
3. Set environment variable `OPENAI_API_KEY` to your API key. Optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`).
4. Run `npm start`
5. Visit http://localhost:3000

**Do not put your API key in the browser/front-end code.** For hosting, configure these environment variables in the hosting dashboard.


## Notes
- Each user message triggers 3 separate model responses (one per character), which means API usage/costs can add up.
- Characters are fictional and presented as AI characters.
- This demo keeps conversation context in the browser during the session; refreshing the page clears it.
