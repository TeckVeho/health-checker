import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SectionHeader from '~/components/Molecules/SectionHeader.vue';

describe('SectionHeader', () => {
  beforeEach(() => {
    // Reset any global state before each test if needed
  });

  describe('Component Rendering', () => {
    it('should mount without errors', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Section',
          count: 5,
          description: 'Test description',
          variant: 'active',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render the title with count', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Active Alerts',
          count: 10,
          description: 'Current active alerts in the system',
          variant: 'active',
        },
      });

      const title = wrapper.find('h2');
      expect(title.text()).toBe('Active Alerts (10)');
    });

    it('should render the description', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Active Alerts',
          count: 10,
          description: 'Current active alerts in the system',
          variant: 'active',
        },
      });

      const description = wrapper.find('p');
      expect(description.text()).toBe('Current active alerts in the system');
    });

    it('should have correct basic structure', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test',
          count: 0,
          description: 'Test description',
        },
      });

      expect(wrapper.find('.p-4').exists()).toBe(true);
      expect(wrapper.find('h2.text-xl.font-bold').exists()).toBe(true);
      expect(wrapper.find('p.text-sm.mt-1').exists()).toBe(true);
    });
  });

  describe('Props Handling', () => {
    it('should handle all required props', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Title',
          count: 42,
          description: 'Test Description',
        },
      });

      expect(wrapper.props('title')).toBe('Test Title');
      expect(wrapper.props('count')).toBe(42);
      expect(wrapper.props('description')).toBe('Test Description');
    });

    it('should use default variant when not provided', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Title',
          count: 1,
          description: 'Test Description',
        },
      });

      expect(wrapper.props('variant')).toBe('active');
    });

    it('should handle custom variant', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Title',
          count: 1,
          description: 'Test Description',
          variant: 'resolved',
        },
      });

      expect(wrapper.props('variant')).toBe('resolved');
    });
  });

  describe('Variant Styling', () => {
    it('should apply active variant styling', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Active Alerts',
          count: 5,
          description: 'Active description',
          variant: 'active',
        },
      });

      const title = wrapper.find('h2');
      const description = wrapper.find('p');

      expect(title.classes()).toContain('text-red-800');
      expect(description.classes()).toContain('text-red-600');
    });

    it('should apply resolved variant styling', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Resolved Alerts',
          count: 3,
          description: 'Resolved description',
          variant: 'resolved',
        },
      });

      const title = wrapper.find('h2');
      const description = wrapper.find('p');

      expect(title.classes()).toContain('text-green-800');
      expect(description.classes()).toContain('text-green-600');
    });

    it('should apply health variant styling', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Health Status',
          count: 1,
          description: 'Health description',
          variant: 'health',
        },
      });

      const title = wrapper.find('h2');
      const description = wrapper.find('p');

      expect(title.classes()).toContain('text-gray-900');
      expect(description.classes()).toContain('text-gray-600');
    });
  });

  describe('Computed Properties', () => {
    it('should compute correct title color for active variant', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test',
          count: 1,
          description: 'Test',
          variant: 'active',
        },
      });

      // Access the computed property through vm
      expect(wrapper.vm.titleColor).toBe('text-red-800');
    });

    it('should compute correct title color for resolved variant', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test',
          count: 1,
          description: 'Test',
          variant: 'resolved',
        },
      });

      expect(wrapper.vm.titleColor).toBe('text-green-800');
    });

    it('should compute correct title color for health variant', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test',
          count: 1,
          description: 'Test',
          variant: 'health',
        },
      });

      expect(wrapper.vm.titleColor).toBe('text-gray-900');
    });

    it('should compute correct description color for active variant', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test',
          count: 1,
          description: 'Test',
          variant: 'active',
        },
      });

      expect(wrapper.vm.descriptionColor).toBe('text-red-600');
    });

    it('should compute correct description color for resolved variant', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test',
          count: 1,
          description: 'Test',
          variant: 'resolved',
        },
      });

      expect(wrapper.vm.descriptionColor).toBe('text-green-600');
    });

    it('should compute correct description color for health variant', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test',
          count: 1,
          description: 'Test',
          variant: 'health',
        },
      });

      expect(wrapper.vm.descriptionColor).toBe('text-gray-600');
    });
  });

  describe('Count Display', () => {
    it('should display zero count', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'No Alerts',
          count: 0,
          description: 'No alerts found',
        },
      });

      const title = wrapper.find('h2');
      expect(title.text()).toBe('No Alerts (0)');
    });

    it('should display positive count', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Some Alerts',
          count: 15,
          description: 'Some alerts found',
        },
      });

      const title = wrapper.find('h2');
      expect(title.text()).toBe('Some Alerts (15)');
    });

    it('should display large count', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Many Alerts',
          count: 999,
          description: 'Many alerts found',
        },
      });

      const title = wrapper.find('h2');
      expect(title.text()).toBe('Many Alerts (999)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: '',
          count: 5,
          description: 'Empty title test',
        },
      });

      const title = wrapper.find('h2');
      expect(title.text()).toBe('(5)');
    });

    it('should handle empty description', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Title',
          count: 5,
          description: '',
        },
      });

      const description = wrapper.find('p');
      expect(description.text()).toBe('');
    });

    it('should handle very long title', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly';
      const wrapper = mount(SectionHeader, {
        props: {
          title: longTitle,
          count: 1,
          description: 'Test description',
        },
      });

      const title = wrapper.find('h2');
      expect(title.text()).toBe(`${longTitle} (1)`);
    });

    it('should handle very long description', () => {
      const longDescription = 'This is a very long description that might cause layout issues if not handled properly and should be displayed correctly without breaking the component layout';
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Title',
          count: 1,
          description: longDescription,
        },
      });

      const description = wrapper.find('p');
      expect(description.text()).toBe(longDescription);
    });

    it('should handle special characters in title and description', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Title with & special <characters> and "quotes"',
          count: 1,
          description: 'Description with & special <characters> and "quotes"',
        },
      });

      const title = wrapper.find('h2');
      const description = wrapper.find('p');

      expect(title.text()).toContain('Title with & special <characters> and "quotes"');
      expect(description.text()).toBe('Description with & special <characters> and "quotes"');
    });
  });

  describe('Accessibility', () => {
    it('should use proper heading hierarchy', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Section Title',
          count: 5,
          description: 'Section description',
        },
      });

      const heading = wrapper.find('h2');
      expect(heading.exists()).toBe(true);
      expect(heading.classes()).toContain('text-xl');
      expect(heading.classes()).toContain('font-bold');
    });

    it('should have proper semantic structure', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Semantic Title',
          count: 5,
          description: 'Semantic Description',
        },
      });

      // Check that title is in a heading element
      expect(wrapper.find('h2').exists()).toBe(true);

      // Check that description is in a paragraph element
      expect(wrapper.find('p').exists()).toBe(true);
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct base CSS classes', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Title',
          count: 1,
          description: 'Test Description',
        },
      });

      const container = wrapper.find('.p-4');
      const title = wrapper.find('h2');
      const description = wrapper.find('p');

      expect(container.exists()).toBe(true);
      expect(title.classes()).toContain('text-xl');
      expect(title.classes()).toContain('font-bold');
      expect(description.classes()).toContain('text-sm');
      expect(description.classes()).toContain('mt-1');
    });

    it('should apply variant-specific classes correctly', () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Test Title',
          count: 1,
          description: 'Test Description',
          variant: 'resolved',
        },
      });

      const title = wrapper.find('h2');
      const description = wrapper.find('p');

      expect(title.classes()).toContain('text-green-800');
      expect(description.classes()).toContain('text-green-600');
    });
  });

  describe('Component Reactivity', () => {
    it('should update when props change', async () => {
      const wrapper = mount(SectionHeader, {
        props: {
          title: 'Initial Title',
          count: 1,
          description: 'Initial Description',
          variant: 'active',
        },
      });

      expect(wrapper.find('h2').text()).toBe('Initial Title (1)');
      expect(wrapper.find('h2').classes()).toContain('text-red-800');

      await wrapper.setProps({
        title: 'Updated Title',
        count: 2,
        description: 'Updated Description',
        variant: 'resolved',
      });

      expect(wrapper.find('h2').text()).toBe('Updated Title (2)');
      expect(wrapper.find('h2').classes()).toContain('text-green-800');
      expect(wrapper.find('p').text()).toBe('Updated Description');
    });
  });
});