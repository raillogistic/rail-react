import client from '@/graphql/apollo-client';

/**
 * Comprehensive Apollo cache cleanup utility
 * Handles proper cleanup of Apollo cache and queries on logout
 */

/**
 * Clears the entire Apollo cache
 */
export function clearApolloCache(): void {
  try {
    console.log('Clearing Apollo cache...');

    // Clear the cache completely
    client.cache.reset();

    console.log('Apollo cache cleared successfully');
  } catch (error) {
    console.error('Error clearing Apollo cache:', error);
  }
}

/**
 * Stops all active Apollo queries
 */
export function stopApolloQueries(): void {
  try {
    console.log('Stopping Apollo queries...');

    // Stop all active queries
    client.stop();

    console.log('Apollo queries stopped successfully');
  } catch (error) {
    console.error('Error stopping Apollo queries:', error);
  }
}

/**
 * Clears specific cache entries by typename
 */
export function clearCacheByType(typenames: string[]): void {
  try {
    console.log('Clearing cache by type:', typenames);

    typenames.forEach(typename => {
      // Evict all cache entries of this type
      client.cache.evict({
        fieldName: typename,
      });
    });

    // Garbage collect evicted entries
    client.cache.gc();

    console.log('Cache cleared by type successfully');
  } catch (error) {
    console.error('Error clearing cache by type:', error);
  }
}

/**
 * Clears user-specific cache data
 */
export function clearUserCache(): void {
  try {
    console.log('Clearing user-specific cache...');

    // Common user-related cache types to clear
    const userTypes = [
      'User',
      'CurrentUser',
      'Profile',
      'UserPermissions',
      'UserRoles',
      'UserPreferences'
    ];

    clearCacheByType(userTypes);

    console.log('User cache cleared successfully');
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

/**
 * Comprehensive logout cleanup
 * Combines cache clearing, query stopping, and user data cleanup
 */
export async function performLogoutCleanup(): Promise<void> {
  try {
    console.log('Starting logout cleanup...');

    // Stop all active queries first
    stopApolloQueries();

    // Clear user-specific cache data
    clearUserCache();

    // Clear all cache data
    clearApolloCache();

    console.log('Logout cleanup completed successfully');
  } catch (error) {
    console.error('Error during logout cleanup:', error);

    // Ensure cleanup completes even if some steps fail
    try {
      // Force clear everything as last resort
      client.cache.reset();
      console.log('Force reset completed as fallback');
    } catch (resetError) {
      console.error('Failed to force reset cache:', resetError);
    }
  }
}

/**
 * Clears cache for specific queries by operation name
 */
export function clearQueryCache(operationNames: string[]): void {
  try {
    console.log('Clearing query cache for operations:', operationNames);

    operationNames.forEach(operationName => {
      // Remove cached query results
      client.cache.evict({
        fieldName: operationName
      });
    });

    // Garbage collect
    client.cache.gc();

    console.log('Query cache cleared successfully');
  } catch (error) {
    console.error('Error clearing query cache:', error);
  }
}

/**
 * Validates that cache cleanup was successful
 */
export function validateCacheCleanup(): boolean {
  try {
    console.log('Validating cache cleanup...');

    const cacheSize = Object.keys(client.cache.extract()).length;

    console.log('Cache validation - Cache entries:', cacheSize);

    // Consider cleanup successful if cache is minimal
    return cacheSize <= 2;
  } catch (error) {
    console.error('Error validating cache cleanup:', error);
    return false;
  }
}

/**
 * Enhanced cleanup with retry mechanism
 */
export async function performLogoutCleanupWithRetry(maxRetries: number = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Logout cleanup attempt ${attempt}/${maxRetries}`);

      await performLogoutCleanup();

      // Validate cleanup was successful
      if (validateCacheCleanup()) {
        console.log('Logout cleanup validated successfully');
        return true;
      }

      console.warn(`Cleanup validation failed on attempt ${attempt}`);

      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error(`Cleanup attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        console.error('All cleanup attempts failed');
        return false;
      }
    }
  }

  return false;
}
