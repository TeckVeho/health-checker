import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useRouteParams() {
  const route = useRoute()
  
  // Extract owner and repo from slug parameter
  const owner = computed(() => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 0 ? slug[0] : null
  })
  
  const repo = computed(() => {
    const slug = route.params.slug
    return Array.isArray(slug) && slug.length > 1 ? slug[1] : null
  })
  
  // Check if both owner and repo are available
  const hasValidParams = computed(() => {
    return Boolean(owner.value && repo.value)
  })
  
  // Get the full slug array
  const slug = computed(() => {
    return route.params.slug as string[] || []
  })
  
  return {
    owner,
    repo,
    slug,
    hasValidParams,
  }
} 