# Flows: the UX map

A playbook for any agent or person, with the design module on: keep `design/flows.yml`, the map of the product's views, the actions on them, where each leads and the paths users take (`PROCESS.md`, "The flows map"). Use it to draft the map of a new project, to read it from the code of an existing one, to change it with a view, a route or a path, and to draw it for the human.

## What it holds

The template's header says the shape (`templates/design/flows.yml`). The rules:

- Every view has a route, or is a `modal:` or `state:` of a view that has one.
- Every action starts from a view and leads to one; `when` says what it needs (a role, a filled form) if not always.
- Every component a view lists is in `design/index.md`.
- A flow's goal is in the user's words; its steps are actions in order, each starting where the previous one led.
- `unsure: true` on what was read from the code and not yet confirmed by the human.

## Use it while working

Before a change to something users see, read the views that show the components it touches, and the flows through them: those are what the design gate shows and the visual check covers. A change that adds or moves a view, a route or a path updates `flows.yml` in the same change, before the design.

## From the code (an existing project)

1. The routes: the project's command, or the router's configuration.
2. For each route's view: the components it renders, its links and navigation calls, its forms and where they lead.
3. Write what is, with `unsure: true` where the code does not say (a navigation built at runtime, a condition read from data), and list those for the human.
4. Each route the map cannot place, and each view in the map with no route in the code, is a gap (`start.md`, "Adopt", step 4).

## Draw it

A diagram is generated from `flows.yml`, never kept: a Mermaid flowchart (one per flow, or the whole map), an HTML page, or a FigJam board (`figma.md`). For a change, propose the new paths as a diagram for the human, then write the result into `flows.yml`. Never draw a view or an action that the file does not have.
