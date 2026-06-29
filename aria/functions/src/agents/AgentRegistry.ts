import type { Agent, AgentManifest } from './Agent'
import type { AgentId, AgentCapability } from './AgentTypes'

export class AgentRegistry {
  private agents = new Map<AgentId, Agent>()
  private manifests = new Map<AgentId, AgentManifest>()

  register(agent: Agent): void {
    if (this.agents.has(agent.manifest.id)) {
      throw new Error(`Agent "${agent.manifest.id}" is already registered`)
    }
    this.agents.set(agent.manifest.id, agent)
    this.manifests.set(agent.manifest.id, agent.manifest)
  }

  unregister(id: AgentId): void {
    this.agents.delete(id)
    this.manifests.delete(id)
  }

  get(id: AgentId): Agent | undefined {
    return this.agents.get(id)
  }

  getByCapability(capability: AgentCapability): Agent[] {
    return Array.from(this.agents.values()).filter(
      (a) =>
        a.status !== 'disabled' &&
        a.status !== 'error' &&
        a.status !== 'shutdown' &&
        !a.manifest.placeholder &&
        a.manifest.capabilities.includes(capability)
    )
  }

  listAll(): Agent[] {
    return Array.from(this.agents.values())
  }

  listManifests(): AgentManifest[] {
    return Array.from(this.manifests.values())
  }

  has(id: AgentId): boolean {
    return this.agents.has(id)
  }

  size(): number {
    return this.agents.size
  }
}
