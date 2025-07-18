# **App Name**: TapScore Hub

## Core Features:

- Referee Signal Reception: Listens for score and penalty signals from referee devices over a local network, using WebSocket or UDP.
- Referee Management: Identifies referees based on their ID and tracks their connection status, marking them inactive if no data is received for a set period.
- Scoreboard System: Tracks and updates scores for both red and blue sides, reacting to referee inputs and providing a reset button and undo functionality.
- Match Timer Control: Controls match timing with start/pause/reset functionality, supports multiple rounds, and indicates round ends with an audible beep.
- UI Panels: Displays scores and referee status in a landscape layout optimized for tablets and scalable to larger screens. Each side is visually separated (Red/Blue).
- Match Logging (Optional): Optionally logs match actions for record-keeping, allowing for export as JSON or CSV.
- Real-Time Advantage Recognition and Recommendation: The LLM will observe the rate of point scoring between two teams. If it recognizes that one team has fallen far enough behind that the game's outcome seems clear, then the tool may highlight a handicap option for the leading team, or recommend it via an accessible notification.

## Style Guidelines:

- Primary color: Saturated red (#E63946) to represent the Red competitor, in alignment with tradition for martial arts.
- Background color: Light red (#F1B8BC) to provide a softer backdrop that complements the intense primary color.
- Accent color: Analogous hue, Blue (#457B9D), chosen to complement the primary red, in accordance with tradition.
- Font: 'Space Grotesk' sans-serif for a modern look in headlines and short blocks of text. Longer blocks of text use 'Inter'.
- Panels on the left and right for Red and Blue, respectively, centered scoreboard, and clear status indicators for referee connections.
- Simple, high-contrast icons to represent actions and status.
- Subtle animations on score updates to visually emphasize changes.