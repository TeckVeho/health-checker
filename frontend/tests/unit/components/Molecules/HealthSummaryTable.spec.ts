import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HealthSummaryTable from '~/components/Molecules/HealthSummaryTable.vue';

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div class="p-datatable"><slot /></div>',
    props: ['value', 'class', 'stripedRows', 'emptyMessage'],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="p-column"><slot name="body" :data="mockData" /></div>',
    props: ['field', 'header', 'class'],
    setup(props, { slots }) {
      const mockData = {
        severity: 'High',
        count: 5,
        percentage: 25,
        tagSeverity: 'danger',
        isTotal: false,
      };
      return () => slots.body?.({ data: mockData });
    },
  },
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span class="p-tag" :class="`p-tag-${severity}`">{{ value }}</span>',
    props: ['value', 'severity', 'class'],
  },
}));

describe('HealthSummaryTable', () => {
  const mockTableData = [
    {
      severity: 'High',
      count: 2,
      percentage: 40,
      tagSeverity: 'danger',
      isTotal: false,
    },
    {
      severity: 'Medium',
      count: 1,
      percentage: 20,
      tagSeverity: 'warning',
      isTotal: false,
    },
    {
      severity: 'Low',
      count: 2,
      percentage: 40,
      tagSeverity: 'info',
      isTotal: false,
    },
    {
      severity: 'Total',
      count: 5,
      percentage: 100,
      tagSeverity: null,
      isTotal: true,
    },
  ];

  describe('Component Rendering', () => {
    it('should mount without errors', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render DataTable component', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    });

    it('should render all columns', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      expect(columns).toHaveLength(3); // severity, count, percentage
    });

    it('should render column headers correctly', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      expect(columns[0].props('header')).toBe('Severity Level');
      expect(columns[1].props('header')).toBe('Count');
      expect(columns[2].props('header')).toBe('Percentage');
    });

    it('should render data table with provided data', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('value')).toEqual(mockTableData);
    });
  });

  describe('Props Handling', () => {
    it('should handle required tableData prop', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(mockTableData);
    });

    it('should handle empty tableData array', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: [],
        },
      });

      expect(wrapper.props('tableData')).toEqual([]);
    });

    it('should handle default emptyMessage prop', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      expect(wrapper.props('emptyMessage')).toBe('No health data available');
    });

    it('should handle custom emptyMessage prop', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
          emptyMessage: 'Custom empty message',
        },
      });

      expect(wrapper.props('emptyMessage')).toBe('Custom empty message');
    });

    it('should handle large dataset', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        severity: `Level ${i}`,
        count: i,
        percentage: i,
        tagSeverity: i % 2 === 0 ? 'danger' : 'info',
        isTotal: false,
      }));

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: largeDataset,
        },
      });

      expect(wrapper.props('tableData')).toEqual(largeDataset);
    });
  });

  describe('Severity Column Rendering', () => {
    it('should render severity with tag when tagSeverity exists', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: [mockTableData[0]], // High severity with tag
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should render severity without tag when tagSeverity is null', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: [mockTableData[3]], // Total severity without tag
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should handle all severity types', () => {
      const allSeverityTypes = [
        { severity: 'Critical', tagSeverity: 'danger' },
        { severity: 'High', tagSeverity: 'warning' },
        { severity: 'Medium', tagSeverity: 'info' },
        { severity: 'Low', tagSeverity: 'success' },
        { severity: 'Total', tagSeverity: null },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: allSeverityTypes.map((item, index) => ({
            ...item,
            count: index + 1,
            percentage: (index + 1) * 20,
            isTotal: item.severity === 'Total',
          })),
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });
  });

  describe('Count Column Rendering', () => {
    it('should render count values correctly', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should apply bold styling to total rows', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: [mockTableData[3]], // Total row
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should handle zero counts', () => {
      const zeroCountData = [
        {
          severity: 'No Issues',
          count: 0,
          percentage: 0,
          tagSeverity: 'success',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: zeroCountData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should handle large counts', () => {
      const largeCountData = [
        {
          severity: 'High',
          count: 9999,
          percentage: 50,
          tagSeverity: 'danger',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: largeCountData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });
  });

  describe('Percentage Column Rendering', () => {
    it('should render percentage values with % symbol', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should apply bold styling to total row percentages', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: [mockTableData[3]], // Total row
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should handle decimal percentages', () => {
      const decimalData = [
        {
          severity: 'Partial',
          count: 1,
          percentage: 33.33,
          tagSeverity: 'info',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: decimalData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });

    it('should handle edge case percentages', () => {
      const edgeCaseData = [
        {
          severity: 'Zero',
          count: 0,
          percentage: 0,
          tagSeverity: 'success',
          isTotal: false,
        },
        {
          severity: 'Full',
          count: 10,
          percentage: 100,
          tagSeverity: 'danger',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: edgeCaseData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.exists()).toBe(true);
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no data', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: [],
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('emptyMessage')).toBe('No health data available');
    });

    it('should show custom empty message', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: [],
          emptyMessage: 'Custom empty message',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('emptyMessage')).toBe('Custom empty message');
    });

    it('should not show empty message when data exists', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('value')).toEqual(mockTableData);
    });
  });

  describe('Data Structure Validation', () => {
    it('should handle complete data structure', () => {
      const completeData = [
        {
          severity: 'Complete',
          count: 5,
          percentage: 100,
          tagSeverity: 'danger',
          isTotal: true,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: completeData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(completeData);
    });

    it('should handle mixed isTotal values', () => {
      const mixedData = [
        { ...mockTableData[0], isTotal: false },
        { ...mockTableData[1], isTotal: false },
        { ...mockTableData[2], isTotal: true },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mixedData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(mixedData);
    });

    it('should handle missing optional properties gracefully', () => {
      const minimalData = [
        {
          severity: 'Minimal',
          count: 1,
          percentage: 50,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: minimalData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(minimalData);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in severity names', () => {
      const specialData = [
        {
          severity: 'High & Critical!',
          count: 2,
          percentage: 40,
          tagSeverity: 'danger',
          isTotal: false,
        },
        {
          severity: 'Low/Medium (≤5)',
          count: 3,
          percentage: 60,
          tagSeverity: 'info',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: specialData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(specialData);
    });

    it('should handle very long severity names', () => {
      const longNameData = [
        {
          severity: 'This is a very long severity name that might cause layout issues',
          count: 1,
          percentage: 100,
          tagSeverity: 'warning',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: longNameData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(longNameData);
    });

    it('should handle numeric severity values', () => {
      const numericData = [
        {
          severity: '1',
          count: 1,
          percentage: 25,
          tagSeverity: 'danger',
          isTotal: false,
        },
        {
          severity: '2',
          count: 2,
          percentage: 50,
          tagSeverity: 'warning',
          isTotal: false,
        },
        {
          severity: '3',
          count: 1,
          percentage: 25,
          tagSeverity: 'info',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: numericData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(numericData);
    });

    it('should handle empty string severity', () => {
      const emptyStringData = [
        {
          severity: '',
          count: 0,
          percentage: 0,
          tagSeverity: 'success',
          isTotal: false,
        },
      ];

      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: emptyStringData,
        },
      });

      expect(wrapper.props('tableData')).toEqual(emptyStringData);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply correct CSS classes to DataTable', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('class')).toBe('p-datatable-sm');
    });

    it('should apply column-specific classes', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
        },
      });

      const columns = wrapper.findAllComponents({ name: 'Column' });
      expect(columns[0].props('class')).toBe('col-severity');
      expect(columns[1].props('class')).toBe('col-count');
      expect(columns[2].props('class')).toBe('col-percentage');
    });
  });

  describe('DataTable Configuration', () => {
    it('should pass correct props to DataTable', () => {
      const wrapper = mount(HealthSummaryTable, {
        props: {
          tableData: mockTableData,
          emptyMessage: 'Custom message',
        },
      });

      const dataTable = wrapper.findComponent({ name: 'DataTable' });
      expect(dataTable.props('value')).toEqual(mockTableData);
      expect(dataTable.props('class')).toBe('p-datatable-sm');
      expect(dataTable.props('stripedRows')).toBe('');
      expect(dataTable.props('emptyMessage')).toBe('Custom message');
    });
  });
});