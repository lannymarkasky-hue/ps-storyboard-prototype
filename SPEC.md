# Prototype Spec

## Goal
Build a Photoshop UXP storyboard panel that uses real layer comps for visual state, but keeps its own panel order.

## Core model
- One panel frame links to one real Photoshop layer comp
- Panel order can differ from native layer comp order
- Panel navigation uses panel order
- Applying a frame applies its linked real layer comp

## Data per frame
- panelId
- compId
- displayName
- order
- active
- selected

## Prototype v1
1. Load all layer comps from active document
2. Show them in a simple list
3. Click item to apply linked layer comp
4. Keep panel order in memory
5. Next / Previous buttons use panel order
6. Move Up / Move Down changes panel order only

## Not in v1
- thumbnails
- export
- PDF
- contact sheets
- isolate mode
- inactive persistence
- native layer comp reorder
