# ARIA Memory Graph

Long-term relational knowledge store. Replaces isolated Firestore records with a navigable graph of nodes and edges.

## Architecture

```
User / Agents
      ↓
  index.ts (public API, per-user singleton sessions)
      ↓
  GraphBuilder  ←  domain objects (tasks, contacts, reminders, chat)
      ↓
  RelationshipEngine  ←  Claude extracts implicit relationships
      ↓
  MemoryGraph  ←  Firestore persistence (nodes + edges + fingerprints)
      ↓
  KnowledgeIndex  ←  in-memory keyword index (TTL cache)
      ↓
  GraphSearch  ←  keyword / semantic / relationship / hybrid
      ↓
  GraphRetriever  ←  search → expand → compress
      ↓
  MemoryCompressor  ←  fits results into Claude token budget
```

## Node Model

Each `GraphNode` has:

| Field       | Type       | Description                          |
|-------------|------------|--------------------------------------|
| id          | string     | UUID                                 |
| type        | NodeType   | person, org, task, reminder, …       |
| title       | string     | Human-readable label                 |
| summary     | string     | Short description                    |
| metadata    | object     | Source-specific fields               |
| importance  | 0–100      | Composite score                      |
| pinned      | boolean    | Manual priority override             |
| version     | number     | Increments on each update            |
| userId      | string     | Owner                                |

### Supported Node Types

person · organization · hospital · office · project · meeting · task · reminder · location · document · conversation · preference · habit · vehicle · expense · health_record · public_health_program · custom

## Relationship Model

Each `GraphEdge` has:

| Field      | Type      | Description                |
|------------|-----------|----------------------------|
| fromId     | NodeId    | Source node                |
| toId       | NodeId    | Target node                |
| type       | EdgeType  | Semantic relationship      |
| weight     | 0–1       | Strength                   |
| confidence | 0–1       | AI or manual confidence    |

### Supported Edge Types

KNOWS · WORKS_AT · BELONGS_TO · PART_OF · LOCATED_IN · MANAGES · ASSIGNED_TO · RELATED_TO · FOLLOW_UP · DEPENDS_ON · MENTIONED_IN · CREATED_BY · UPDATED_BY · ATTENDED · VISITED · CUSTOM

Nodes are **deduplicated by fingerprint** (`userId::type::title.toLowerCase()`). Upserts merge metadata and keep the highest importance.

## Search Pipeline

```
query → GraphSearch.search(opts)
          ├── keyword:      KnowledgeIndex.keywordSearch
          ├── semantic:     Claude picks relevant nodeIds
          ├── relationship: BFS traversal from seed nodes
          └── hybrid:       keyword + relationship, merged & boosted
```

Results are scored by `MemoryScorer` (importance 35% · recency 25% · frequency · relationship strength · pin bonus).

## Compression Strategy

`MemoryCompressor.compress()`:
1. Formats results as structured text (node titles + edge summaries)
2. Estimates token count (`chars / 4`)
3. If within budget → returns raw text
4. If over budget → asks Claude to summarize to fit the budget

Default budget: **4000 tokens** (configurable via `MemoryConfig.compressionTokenBudget`).

## Memory Expansion

`MemoryExpander` lazy-loads edges for top-ranked nodes only.  
Agents that need detail on a specific node call `expandNode(nodeId)` explicitly.  
The Orchestrator never pre-expands everything.

## Analytics

`MemoryAnalytics.computeStats()` returns:
- Node/edge counts and type distributions
- Average degree, orphan node count
- Top 10 most-connected nodes
- Top contacts by mention frequency
- Active projects by linked task count

Plugin `AnalyticsProvider` implementations can register additional computations.

## Plugin Extension Points

```typescript
// Register a custom node type
registerNodeType({ type: 'invoice', label: 'Invoice', description: '...' })

// Register a graph enricher
registerEnricher({ name: 'crm-enricher', enrich: async (node, db) => ({ ... }) })

// Register a custom search provider
registerSearchProvider({ name: 'vector-search', search: async (opts, nodes) => [...] })

// Register a custom analytics provider
registerAnalyticsProvider({ name: 'usage-stats', compute: async (nodes, edges) => ({...}) })
```

## Firestore Collections (per-user)

```
users/{uid}/memoryNodes/{nodeId}
users/{uid}/memoryEdges/{edgeId}
users/{uid}/memoryFingerprints/{base64(fingerprint)}
users/{uid}/memoryHistory/{nodeId}_v{version}
```

## Manual Test Cases

```
# 1. Relationship extraction
POST extractRelationships { text: "Dr. Ramesh works at District Hospital." }
→ Creates: Person(Dr. Ramesh) -[WORKS_AT]→ Hospital(District Hospital)

# 2. Query person
POST searchMemoryGraph { query: "Where does Dr. Ramesh work?", mode: "relationship" }
→ Returns Dr. Ramesh node + WORKS_AT edge → District Hospital

# 3. Reminder linking
POST buildMemoryFromReminder { title: "Meet Dr. Ramesh tomorrow", relatedContactName: "Dr. Ramesh" }
→ Creates: Reminder(Meet Dr. Ramesh…) -[RELATED_TO]→ Person(Dr. Ramesh)

# 4. Project traversal
POST searchMemoryGraph { query: "Projects involving Dr. Ramesh", mode: "relationship" }
→ Traverses RELATED_TO, ASSIGNED_TO, PART_OF edges from Dr. Ramesh node
```
