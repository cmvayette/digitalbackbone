/**
 * Holon Registry - Manages holon creation, storage, and retrieval
 * 
 * This module provides:
 * - UUID-based holon ID generation
 * - Holon registry to track all holons by ID and type
 * - Holon creation with ID assignment
 * - Holon query by ID and by type
 * - Holon inactivation (mark inactive without deletion)
 */

import { randomUUID } from 'crypto';
import { Holon, HolonID, HolonType } from '@som/shared-types';
import { IHolonRepository, CreateHolonParams, HolonQueryFilters } from './interfaces/holon-repository';
import { QueryOptions } from './interfaces/repository';

/**
 * HolonRegistry manages the lifecycle and storage of all holons in the system
 */
export class InMemoryHolonRepository implements IHolonRepository {
  private holons: Map<HolonID, Holon>;
  private holonsByType: Map<HolonType, Set<HolonID>>;

  constructor() {
    this.holons = new Map();
    this.holonsByType = new Map();

    // Initialize type index for all holon types
    Object.values(HolonType).forEach(type => {
      this.holonsByType.set(type, new Set());
    });
  }

  // IRepository methods
  async save(item: Holon): Promise<void> {
    this.holons.set(item.id, item);
    const typeSet = this.holonsByType.get(item.type);
    if (typeSet) {
      typeSet.add(item.id);
    }
  }

  async findById(id: string): Promise<Holon | null> {
    return this.holons.get(id) || null;
  }

  async find(query: Record<string, any>, _options?: QueryOptions): Promise<Holon[]> {
    // Basic implementation of find - can be expanded
    return Array.from(this.holons.values()).filter(holon => {
      for (const key in query) {
        if ((holon as any)[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async delete(id: string): Promise<void> {
    const holon = this.holons.get(id);
    if (holon) {
      this.holons.delete(id);
      const typeSet = this.holonsByType.get(holon.type);
      if (typeSet) {
        typeSet.delete(id);
      }
    }
  }

  /**
   * Generate a unique UUID-based holon ID
   * @returns A unique HolonID
   */
  generateHolonID(): HolonID {
    return randomUUID();
  }

  /**
   * Create a new holon with automatic ID assignment
   * @param params - Holon creation parameters
   * @returns The created holon with assigned ID
   */
  async createHolon(params: CreateHolonParams): Promise<Holon> {
    const id = params.id || this.generateHolonID();
    const now = new Date();

    const holon: Holon = {
      id,
      type: params.type,
      properties: params.properties,
      createdAt: now,
      createdBy: params.createdBy,
      status: 'active',
      sourceDocuments: params.sourceDocuments
    };

    // Store holon
    await this.save(holon);

    return holon;
  }

  /**
   * Get a holon by its ID
   * @param holonID - The ID of the holon to retrieve
   * @returns The holon if found, undefined otherwise
   */
  async getHolon(holonID: HolonID): Promise<Holon | undefined> {
    return this.holons.get(holonID);
  }

  /**
   * Get all holons of a specific type
   * @param type - The holon type to query
   * @param filters - Optional filters to apply
   * @returns Array of holons matching the type and filters
   */
  async getHolonsByType(type: HolonType, filters?: HolonQueryFilters): Promise<Holon[]> {
    const typeSet = this.holonsByType.get(type);
    if (!typeSet) {
      return [];
    }

    const holons: Holon[] = [];
    for (const id of typeSet) {
      const holon = this.holons.get(id);
      if (holon && this.matchesFilters(holon, filters)) {
        holons.push(holon);
      }
    }

    return holons;
  }

  /**
   * Mark a holon as inactive without deleting it
   * @param holonID - The ID of the holon to inactivate
   * @param reason - The reason for inactivation (for audit purposes)
   * @returns true if the holon was inactivated, false if not found
   */
  async markHolonInactive(holonID: HolonID, _reason?: string): Promise<boolean> {
    const holon = this.holons.get(holonID);
    if (!holon) {
      return false;
    }

    // Mark as inactive (mutation is acceptable here as we're managing state)
    holon.status = 'inactive';

    // Store the holon back (ensures any observers see the change)
    this.holons.set(holonID, holon);

    return true;
  }

  /**
   * Get the complete history/state of a holon including when inactive
   * @param holonID - The ID of the holon
   * @returns The holon if it exists (active or inactive), undefined otherwise
   */
  async getHolonHistory(holonID: HolonID): Promise<Holon | undefined> {
    return this.holons.get(holonID);
  }

  /**
   * Get all holons (active and inactive)
   * @returns Array of all holons in the registry
   */
  async getAllHolons(): Promise<Holon[]> {
    return Array.from(this.holons.values());
  }

  /**
   * Check if a holon exists by ID
   * @param holonID - The ID to check
   * @returns true if the holon exists, false otherwise
   */
  async hasHolon(holonID: HolonID): Promise<boolean> {
    return this.holons.has(holonID);
  }

  /**
   * Get the count of holons by type
   * @param type - The holon type
   * @param includeInactive - Whether to include inactive holons in the count
   * @returns The count of holons
   */
  async getHolonCount(type?: HolonType, includeInactive: boolean = true): Promise<number> {
    if (type) {
      const typeSet = this.holonsByType.get(type);
      if (!typeSet) {
        return 0;
      }

      if (includeInactive) {
        return typeSet.size;
      }

      let count = 0;
      for (const id of typeSet) {
        const holon = this.holons.get(id);
        if (holon && holon.status === 'active') {
          count++;
        }
      }
      return count;
    }

    if (includeInactive) {
      return this.holons.size;
    }

    let count = 0;
    for (const holon of this.holons.values()) {
      if (holon.status === 'active') {
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all holons from the registry (for testing purposes)
   */
  async clear(): Promise<void> {
    this.holons.clear();
    this.holonsByType.forEach(set => set.clear());
  }

  /**
   * Check if a holon matches the provided filters
   */
  private matchesFilters(holon: Holon, filters?: HolonQueryFilters): boolean {
    if (!filters) {
      return true;
    }

    if (filters.status && holon.status !== filters.status) {
      return false;
    }

    if (filters.createdAfter && holon.createdAt < filters.createdAfter) {
      return false;
    }

    if (filters.createdBefore && holon.createdAt > filters.createdBefore) {
      return false;
    }

    return true;
  }
}

// Export a singleton instance for convenience
export const holonRepository = new InMemoryHolonRepository();

