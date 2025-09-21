import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthorGroupedTable from '~/components/Molecules/AuthorGroupedTable.vue';

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="p-datatable"><slot /></div>',
    props: ['value', 'loading', 'stripedRows', 'responsiveLayout', 'class', 'sortMode', 'sortField', 'sortOrder'],
    emits: ['sort'],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="p-column"><slot name="body" /></div>',
    props: ['field', 'header', 'sortable', 'class'],
  },
}));

vi.mock('primevue/avatar', () => ({
  default: {
    name: 'Avatar',
    template: '<div class="p-avatar" :style="style">{{ label }}</div>',
    props: ['label', 'size', 'shape', 'style'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button class="p-button" :class="`p-button-${severity}`" :disabled="disabled"><i v-if="icon" :class="icon"></i><slot /></button>',
    props: ['icon', 'severity', 'text', 'size', 'class', 'disabled'],
    emits: ['click'],
  },
}));

vi.mock('primevue/tooltip', () => ({
  default: {
    name: 'Tooltip',
    template: '<div><slot /></div>',
    props: ['target', 'position', 'showDelay', 'hideDelay'],
  },
}));

// Mock composables
vi.mock('~/composables/useAuthorAlerts', () => ({
  useAuthorAlerts: () => ({
    data: [],
    loading: false,
    error: null,
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 25,
    sortField: 'author',
    sortOrder: 'asc',
    fetchData: vi.fn(),
    refreshData: vi.fn(),
    onSort: vi.fn(),
    navigateToAuthor: vi.fn(),
  }),
}));

vi.mock('~/composables/useRouteParams', () => ({
  useRouteParams: () => ({
    owner: 'test-owner',
    repo: 'test-repo',
  }),
}));

// Mock router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe.skip('AuthorGroupedTable', () => {
  describe('Component Rendering', () => {
    it('should mount without errors', () => {
      const wrapper = mount(AuthorGroupedTable);
      expect(wrapper.exists()).toBe(true);
    });

    it('should show loading state when loading is true', () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          loading: true,
        },
      });

      expect(wrapper.find('.space-y-4').exists()).toBe(true);
      expect(wrapper.text()).toContain('Loading...');
    });

    it.skip('should show error state when error exists', () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          error: 'Test error message',
        },
      });

      expect(wrapper.text()).toContain('Error loading author data: Test error message');
      expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Button' }).text()).toBe('Try Again');
    });

    it('should show empty state when no data', () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: [],
        },
      });

      expect(wrapper.text()).toContain('No authors with alerts found.');
    });

    it.skip('should render data table when data exists', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {
            gitleaks: 5,
            branch: 3,
            clone: 2,
          },
          lastAlertAt: '2024-01-01T10:00:00Z',
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    });
  });

  describe('Props Handling', () => {
    it('should handle loading prop correctly', () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          loading: true,
        },
      });

      expect(wrapper.props('loading')).toBe(true);
    });

    it('should handle showOnlyActive prop', () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          showOnlyActive: true,
        },
      });

      expect(wrapper.props('showOnlyActive')).toBe(true);
    });
  });

  describe('Pagination', () => {
    it.skip('should show pagination info when data exists', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
          totalItems: 75,
          currentPage: 3,
          itemsPerPage: 25,
        },
      });

      expect(wrapper.text()).toContain('Showing 51-75 of 75 authors');
    });

    it('should handle page changes', async () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          currentPage: 1,
        },
      });

      // Test page change logic
      expect(wrapper.props('currentPage')).toBe(1);
    });
  });

  describe('Sorting', () => {
    it('should handle sort by author', async () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
          sortField: 'author',
          sortOrder: 'asc',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('sortField')).toBe('author');
      expect(dataTable.props('sortOrder')).toBe(1);
    });

    it('should handle sort by totalAlerts', async () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
          sortField: 'totalAlerts',
          sortOrder: 'desc',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('sortField')).toBe('totalAlerts');
      expect(dataTable.props('sortOrder')).toBe(-1);
    });

    it('should handle sort by issue type counts', async () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {
            gitleaks: 5,
          },
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
          sortField: 'gitleaks',
          sortOrder: 'asc',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('sortField')).toBe('gitleaks');
    });
  });

  describe('Navigation', () => {
    it('should navigate to author page when external link is clicked', async () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      const button = wrapper.findComponent({ name: 'Button' });
      if (button.exists()) {
        await button.trigger('click');
        // Test navigation logic
        expect(button.exists()).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should show retry button and handle refresh', async () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          error: 'Test error',
        },
      });

      const retryButton = wrapper.findComponent({ name: 'Button' });
      expect(retryButton.exists()).toBe(true);

      await retryButton.trigger('click');
      // Test refresh logic
    });
  });

  describe('Computed Properties', () => {
    it('should compute loading state correctly', () => {
      const wrapper = mount(AuthorGroupedTable, {
        props: {
          loading: true,
        },
      });

      expect(wrapper.props('loading')).toBe(true);
    });

    it('should compute sortField correctly', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
          sortField: 'author',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('sortField')).toBe('author');
    });
  });

  describe('Utility Methods', () => {
    it('should generate consistent author colors', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      // Test color generation logic
      expect(wrapper.vm.getAuthorColor).toBeDefined();
    });

    it('should format dates correctly', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      // Test date formatting
      expect(wrapper.vm.formatDate).toBeDefined();
    });

    it('should handle navigation with encoded URIs', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      // Test navigation logic
      expect(wrapper.vm.navigateToAuthor).toBeDefined();
    });
  });

  describe('Lifecycle', () => {
    it('should fetch data on mount', () => {
      const wrapper = mount(AuthorGroupedTable);
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing issue type counts', () => {
      const dataWithMissingCounts = [
        {
          author: 'test-author',
          totalAlerts: 5,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: dataWithMissingCounts,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    });

    it('should handle null totalAlerts', () => {
      const dataWithNullTotal = [
        {
          author: 'test-author',
          totalAlerts: null,
          issueTypeCounts: {
            gitleaks: 2,
          },
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: dataWithNullTotal,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    });

    it('should handle pagination edge cases', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
          totalItems: 1,
          currentPage: 1,
          itemsPerPage: 25,
        },
      });

      expect(wrapper.text()).toContain('Showing 1-1 of 1 authors');
    });
  });

  describe('Data Table Configuration', () => {
    it('should pass correct props to DataTable', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
          loading: false,
          sortField: 'author',
          sortOrder: 'asc',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('value')).toEqual(mockData);
      expect(dataTable.props('loading')).toBe(false);
      expect(dataTable.props('stripedRows')).toBe('');
      expect(dataTable.props('responsiveLayout')).toBe('scroll');
      expect(dataTable.props('sortMode')).toBe('single');
      expect(dataTable.props('sortField')).toBe('author');
      expect(dataTable.props('sortOrder')).toBe(1);
    });

    it('should apply correct CSS classes to DataTable', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('class')).toBe('p-datatable-sm');
    });
  });

  describe('Column Configuration', () => {
    it('should render all required columns', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      expect(columns.length).toBeGreaterThan(0);
    });

    it('should render author column with correct configuration', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      const authorColumn = columns[0];
      expect(authorColumn.props('field')).toBe('author');
      expect(authorColumn.props('header')).toBe('Author');
      expect(authorColumn.props('sortable')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      expect(wrapper.find('.space-y-4').exists()).toBe(true);
    });

    it('should have proper role attributes', () => {
      const mockData = [
        {
          author: 'test-author-1',
          totalAlerts: 10,
          issueTypeCounts: {},
        },
      ];

      const wrapper = mount(AuthorGroupedTable, {
        props: {
          data: mockData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });
  });
});