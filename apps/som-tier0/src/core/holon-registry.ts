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
import { Holon, HolonID, HolonType, EventID, DocumentID, Timestamp } from './types/holon';

export interface CreateHolonParams {
  type: HolonType;
  properties: Record<string, any>;
  createdBy: EventID;
  sourceDocuments: DocumentID[];
}

export interface HolonQueryFilters {
  status?: 'active' | 'inactive';
  createdAfter?: Timestamp;
  createdBefore?: Timestamp;
}

/**
 * HolonRegistry manages the lifecycle and storage of all holons in the system
 */
export class HolonRegistry {
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
  createHolon(params: CreateHolonParams): Holon {
    const id = this.generateHolonID();
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
    this.holons.set(id, holon);
    
    // Update type index
    const typeSet = this.holonsByType.get(params.type);
    if (typeSet) {
      typeSet.add(id);
    }

    return holon;
  }

  /**
   * Get a holon by its ID
   * @param holonID - The ID of the holon to retrieve
   * @returns The holon if found, undefined otherwise
   */
  getHolon(holonID: HolonID): Holon | undefined {
    return this.holons.get(holonID);
  }

  /**
   * Get all holons of a specific type
   * @param type - The holon type to query
   * @param filters - Optional filters to apply
   * @returns Array of holons matching the type and filters
   */
  getHolonsByType(type: HolonType, filters?: HolonQueryFilters): Holon[] {
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
  markHolonInactive(holonID: HolonID, reason?: string): boolean {
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
  getHolonHistory(holonID: HolonID): Holon | undefined {
    return this.holons.get(holonID);
  }

  /**
   * Get all holons (active and inactive)
   * @returns Array of all holons in the registry
   */
  getAllHolons(): Holon[] {
    return Array.from(this.holons.values());
  }

  /**
   * Check if a holon exists by ID
   * @param holonID - The ID to check
   * @returns true if the holon exists, false otherwise
   */
  hasHolon(holonID: HolonID): boolean {
    return this.holons.has(holonID);
  }

  /**
   * Get the count of holons by type
   * @param type - The holon type
   * @param includeInactive - Whether to include inactive holons in the count
   * @returns The count of holons
   */
  getHolonCount(type?: HolonType, includeInactive: boolean = true): number {
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
  clear(): void {
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
export const holonRegistry = new HolonRegistry();
