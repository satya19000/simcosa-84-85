import type { AgentTask } from './AgentTask'
import type { AgentTaskId } from './AgentTypes'
import { ExecutionGraph } from './ExecutionGraph'
import type { GraphRunId } from './AgentTypes'

/**
 * Validates a task list for dependency integrity and builds an ExecutionGraph.
 * Detects: missing dependencies, circular dependencies.
 */
export class DependencyResolver {
  resolve(graphRunId: GraphRunId, tasks: AgentTask[]): ExecutionGraph {
    const graph = new ExecutionGraph(graphRunId)
    const ids = new Set(tasks.map((t) => t.taskId))

    // Validate all declared dependencies exist
    for (const task of tasks) {
      for (const dep of task.dependsOn) {
        if (!ids.has(dep)) {
          throw new Error(
            `Task "${task.taskId}" depends on "${dep}" which is not in the task list`
          )
        }
      }
      graph.addTask(task)
    }

    // Detect cycles via DFS
    const visited = new Set<AgentTaskId>()
    const inStack = new Set<AgentTaskId>()

    const taskMap = new Map(tasks.map((t) => [t.taskId, t]))

    const dfs = (id: AgentTaskId): void => {
      visited.add(id)
      inStack.add(id)
      for (const dep of taskMap.get(id)?.dependsOn ?? []) {
        if (inStack.has(dep)) {
          throw new Error(`Circular dependency detected involving task "${id}" → "${dep}"`)
        }
        if (!visited.has(dep)) dfs(dep)
      }
      inStack.delete(id)
    }

    for (const task of tasks) {
      if (!visited.has(task.taskId)) dfs(task.taskId)
    }

    return graph
  }
}
