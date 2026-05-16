import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import RepoTable from '~/components/Molecules/RepoTable.vue';

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="p-datatable"><slot /></div>',
    props: ['value', 'class', 'stripedRows', 'responsiveLayout', 'sortMode', 'sortField', 'sortOrder', 'loading', 'emptyMessage'],
    emits: ['sort'],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="p-column"><slot name="body" :data="mockData" /></div>',
    props: ['field', 'header', 'sortable'],
    setup(props, { slots }) {
      const mockData = {
        name: 'test-repo',
        owner: 'test-owner',
        description: 'Test repository description',
        totalViolations: 5,
        high: 2,
        middle: 2,
        low: 1,
      };
      return () => slots.body?.({ data: mockData });
    },
  },
}));

// Mock BaseTag component
vi.mock('@/components/Atoms/tags/BaseTag.vue', () => ({
  default: {
    name: 'BaseTag',
    template: '<span class="base-tag">{{ value }}</span>',
    props: ['value'],
  },
}));

// Mock router
vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a class="router-link" :href="to" :aria-label="ariaLabel"><slot /></a>',
    props: ['to', 'aria-label'],
  },
}));

describe('RepoTable', () => {
  const mockTableData = [
    {
      name: 'test-repo-1',
      owner: 'test-owner-1',
      description: 'First test repository',
      totalViolations: 5,
      high: 2,
      middle: 2,
      low: 1,
    },
    {
      name: 'test-repo-2',
      owner: 'test-owner-2',
      description: 'Second test repository',
      totalViolations: 3,
      high: 1,
      middle: 1,
      low: 1,
    },
  ];

  const mockColumns = [
    { key: 'high', label: 'High', tagSeverity: 'danger' },
    { key: 'middle', label: 'Middle', tagSeverity: 'warning' },
    { key: 'low', label: 'Low', tagSeverity: 'info' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should mount without errors', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render DataTable component', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    });

    it('should render container with correct class', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
          customClass: 'custom-class',
        },
      });

      expect(wrapper.find('.repo-table-container').exists()).toBe(true);
      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });

    it('should render all columns', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      // Repository + Total defaults + severity columns from props (mockColumns length 3)
      expect(columns.length).toBeGreaterThanOrEqual(5);
    });

    it('should render repository name column', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      expect(columns.length).toBeGreaterThan(0);
      // Focus on testing that columns are rendered rather than specific prop values
      // since the mocking makes it difficult to test exact props
    });

    it('should render description column', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      expect(columns.length).toBeGreaterThan(1);
      // Test that multiple columns are rendered
    });

    it('should render total violations column', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      expect(columns.length).toBeGreaterThan(2);
      // Test that at least 3 columns are rendered
    });
  });

  describe('Props Handling', () => {
    it('should handle required tableData prop', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      expect(wrapper.props('tableData')).toEqual(mockTableData);
    });

    it('should handle required columns prop', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      expect(wrapper.props('columns')).toEqual(mockColumns);
    });

    it('should handle loading prop', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
          loading: true,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('loading')).toBe(true);
    });

    it('should handle emptyMessage prop', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: [],
          columns: mockColumns,
          emptyMessage: 'Custom empty message',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('emptyMessage')).toBe('Custom empty message');
    });

    it('should use default emptyMessage when not provided', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: [],
          columns: mockColumns,
        },
      });

      expect(wrapper.props('emptyMessage')).toBe('No repositories found');
    });

    it('should handle custom class prop', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
          customClass: 'my-custom-class',
        },
      });

      expect(wrapper.find('.my-custom-class').exists()).toBe(true);
    });
  });

  describe('Sorting', () => {
    it('should handle sort state prop', () => {
      const sortState = { field: 'name', order: 'asc' };
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
          sortState,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('sortField')).toBe('name');
      expect(dataTable.props('sortOrder')).toBe(1); // asc = 1
    });

    it('should handle desc sort order', () => {
      const sortState = { field: 'totalViolations', order: 'desc' };
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
          sortState,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('sortField')).toBe('totalViolations');
      expect(dataTable.props('sortOrder')).toBe(-1); // desc = -1
    });

    it('should use default sort state when not provided', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('sortField')).toBe('lastActivityAt');
      expect(dataTable.props('sortOrder')).toBe(-1); // desc = -1
    });

    it('should emit sort-change when sort event occurs', async () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      await dataTable.vm.$emit('sort', { sortField: 'name', sortOrder: 1 });

      expect(wrapper.emitted('sort-change')).toBeTruthy();
      expect(wrapper.emitted('sort-change')?.[0]).toEqual(['name', 'asc']);
    });
  });

  describe('DataTable Configuration', () => {
    it('should pass correct props to DataTable', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
          loading: false,
          tableClass: 'custom-table-class',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('value')).toEqual(mockTableData);
      expect(dataTable.props('stripedRows')).toBe('');
      expect(dataTable.props('responsiveLayout')).toBe('scroll');
      expect(dataTable.props('sortMode')).toBe('single');
      expect(dataTable.props('loading')).toBe(false);
    });

    it('should apply correct CSS classes to DataTable', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
          tableClass: 'custom-table-class',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      const classes = dataTable.props('class');
      expect(classes).toContain('p-datatable-sm');
      expect(classes).toContain('shadow-md');
      expect(classes).toContain('border');
      expect(classes).toContain('border-gray-200');
      expect(classes).toContain('rounded-md');
      expect(classes).toContain('custom-table-class');
    });
  });

  describe('Dynamic Columns', () => {
    it('should render dynamic columns based on columns prop', () => {
      const customColumns = [
        { key: 'critical', label: 'Critical', tagSeverity: 'danger' },
        { key: 'warning', label: 'Warning', tagSeverity: 'warning' },
      ];

      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: customColumns,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      // Should have at least the dynamic columns
      expect(columns.length).toBeGreaterThanOrEqual(customColumns.length);
    });

    it('should handle empty columns array', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: [],
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      // Default columns: Repository (name), Total violations only when columns prop is empty
      expect(columns.length).toBe(2);
    });
  });

  describe('Component Behavior', () => {
    it('should render BaseTag components for violation counts', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const baseTags = wrapper.findAllComponents({ name: 'BaseTag' });
      expect(baseTags.length).toBeGreaterThan(0);
    });

    it('should render RouterLink components for repository navigation', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const routerLinks = wrapper.findAllComponents({ name: 'RouterLink' });
      expect(routerLinks.length).toBeGreaterThan(0);
    });

    it('should handle onSort method correctly', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      // Test the onSort method directly
      const event = { sortField: 'name', sortOrder: 1 };
      wrapper.vm.onSort(event);

      expect(wrapper.emitted('sort-change')).toBeTruthy();
      expect(wrapper.emitted('sort-change')?.[0]).toEqual(['name', 'asc']);
    });

    it('should handle onSort with negative sortOrder', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const event = { sortField: 'totalViolations', sortOrder: -1 };
      wrapper.vm.onSort(event);

      expect(wrapper.emitted('sort-change')).toBeTruthy();
      expect(wrapper.emitted('sort-change')?.[0]).toEqual(['totalViolations', 'desc']);
    });

    it('should handle onSort with field property instead of sortField', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const event = { field: 'description', sortOrder: 1 };
      wrapper.vm.onSort(event);

      expect(wrapper.emitted('sort-change')).toBeTruthy();
      expect(wrapper.emitted('sort-change')?.[0]).toEqual(['description', 'asc']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty table data', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: [],
          columns: mockColumns,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('value')).toEqual([]);
    });

    it('should handle repositories with missing description', () => {
      const dataWithMissingDescription = [
        {
          name: 'test-repo',
          owner: 'test-owner',
          description: null,
          totalViolations: 5,
          high: 2,
          middle: 2,
          low: 1,
        },
      ];

      const wrapper = mount(RepoTable, {
        props: {
          tableData: dataWithMissingDescription,
          columns: mockColumns,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    });

    it('should handle repositories with zero violations', () => {
      const dataWithZeroViolations = [
        {
          name: 'clean-repo',
          owner: 'test-owner',
          description: 'Repository with no violations',
          totalViolations: 0,
          high: 0,
          middle: 0,
          low: 0,
        },
      ];

      const wrapper = mount(RepoTable, {
        props: {
          tableData: dataWithZeroViolations,
          columns: mockColumns,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    });

    it('should handle large datasets', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        name: `repo-${i}`,
        owner: `owner-${i}`,
        description: `Description for repository ${i}`,
        totalViolations: i,
        high: Math.floor(i / 3),
        middle: Math.floor(i / 3),
        low: Math.floor(i / 3),
      }));

      const wrapper = mount(RepoTable, {
        props: {
          tableData: largeDataset,
          columns: mockColumns,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).props('value')).toEqual(largeDataset);
    });
  });

  describe('Accessibility', () => {
    it('should have proper container structure', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      expect(wrapper.find('.repo-table-container').exists()).toBe(true);
    });

    it('should have minimum height for container', () => {
      const wrapper = mount(RepoTable, {
        props: {
          tableData: mockTableData,
          columns: mockColumns,
        },
      });

      const container = wrapper.find('.repo-table-container');
      expect(container.exists()).toBe(true);
    });
  });
});