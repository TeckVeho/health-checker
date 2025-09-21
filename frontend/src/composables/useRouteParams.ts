import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function useRouteParams() {
  const route = useRoute();

  // Extract owner and repo from slug parameter
  const owner = computed(() => {
    // First try direct params
    if (route.params.owner !== undefined) {
      return route.params.owner;
    }
    // Fallback to slug
    const slug = route.params.slug;
    return Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined;
  });

  const repo = computed(() => {
    // First try direct params
    if (route.params.repo !== undefined) {
      return route.params.repo;
    }
    // Fallback to slug
    const slug = route.params.slug;
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : undefined;
  });

  // Extract author from params
  const author = computed(() => {
    return route.params.author;
  });

  // Extract query parameters
  const tab = computed(() => {
    return route.query.tab;
  });

  const page = computed(() => {
    return route.query.page;
  });

  // Check if both owner and repo are available
  const hasValidParams = computed(() => {
    return Boolean(owner.value && repo.value);
  });

  // Get the full slug array
  const slug = computed(() => {
    return (route.params.slug as string[]) || [];
  });

  return {
    owner,
    repo,
    author,
    tab,
    page,
    slug,
    hasValidParams,
  };
}
