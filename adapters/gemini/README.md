# Gemini Apps adapter

Gemini Apps uses Gems rather than local Agent Skill discovery. Create a Gem in
the Gemini web app, copy the contents of `GEM_INSTRUCTIONS.md` into its
instructions, and save it. The Gem then becomes available on Gemini surfaces
supported by the user's account.

This adapter preserves the evidence and safety rules but cannot assume access
to the user's local Agent Reach, OpenCLI, browser authentication, Node.js, ASR,
or filesystem. It must never report those operations as completed unless the
current Gemini surface actually performed them and returned the evidence.
