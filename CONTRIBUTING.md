# Contributing to Tired

Tired welcomes contributions of code, art, and world content. Read the
[game notes](GAME_NOTES.md) and [project rules](AGENTS.md) before starting.
The prototype is deliberately small, and development proceeds one inspectable
change at a time.

## Choose a small change

Open an issue to discuss a new mechanic, area, or broader idea before building
it. Describe the smallest first step and how someone can try or verify it.
Keep each pull request focused on that agreed step. A small fix with a clear
result can go straight to a pull request.

## Submit a contribution

1. Fork [Mbeaulne/Tired](https://github.com/Mbeaulne/Tired) and create a branch
   in your fork.
2. Make the selected change. Preserve the game's bounded resource use and
   keep the project notes and affected tasks current.
3. Run the checks relevant to your change. For game code, use `npm run build`
   and `npm test`; browser setup is described in [README.md](README.md#run-locally).
4. Open a pull request against the official `main` branch. Explain what changes,
   how to try it, and what you checked. Include a screenshot when a visual
   change benefits from one.

Mbeaulne reviews and merges contributions. GitHub rules restrict updates to
the official `main` branch to that account. `CODEOWNERS` routes review requests
to Mbeaulne; repository rules enforce merge access. Contributors work through
forks and pull requests.

## License

Project contributions are provided under the [MIT license](LICENSE). Submit
work you have the right to license on those terms. Third-party dependencies
retain their own licenses.
