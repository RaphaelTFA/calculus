/**
 * Interaction Slide Engine
 *
 * Dispatches to the correct interaction type component based on
 * the `interactionType` field in the lesson config.
 *
 * Usage in a slide JSON block:
 * {
 *   "type": "interaction",
 *   "content": {
 *     "interactionType": "A",   // "A" | "B" | "C" | "E"
 *     "lesson": { ...overrides } // optional — falls back to each type's default
 *   }
 * }
 */

export { default as InteractionTypeA } from './InteractionTypeA'
export { default as InteractionTypeB } from './InteractionTypeB'
export { default as InteractionTypeC } from './InteractionTypeC'
export { default as InteractionTypeE } from './InteractionTypeE'

import InteractionTypeA from './InteractionTypeA'
import InteractionTypeB from './InteractionTypeB'
import InteractionTypeC from './InteractionTypeC'
import InteractionTypeE from './InteractionTypeE'

const TYPE_MAP = {
  'A': InteractionTypeA,
  'B': InteractionTypeB,
  'C': InteractionTypeC,
  'E': InteractionTypeE,
}

/**
 * InteractionSlide — renders the correct engine for a given interactionType.
 *
 * Props:
 *   interactionType  "A" | "B" | "C" | "E"
 *   lesson           optional lesson config object to override defaults
 */
export default function InteractionSlide({ interactionType, lesson }) {
  console.log('Rendering InteractionSlide with type', interactionType, 'and lesson config', lesson)
  const Component = TYPE_MAP[interactionType]

  if (!Component) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ef4444', fontSize: 14
      }}>
        Unknown interaction type: <strong style={{ marginLeft: 4 }}>{interactionType}</strong>
      </div>
    )
  } 

  return <Component lesson={lesson} />
}
