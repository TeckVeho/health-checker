import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HealthSummaryCard from '~/components/Molecules/HealthSummaryCard.vue';

describe('HealthSummaryCard', () => {
  describe('Component Rendering', () => {
    it('should mount without errors', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should render with required props', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Health Summary',
          description: 'This is a health summary card',
        },
      });

      expect(wrapper.find('h3').text()).toBe('Health Summary');
      expect(wrapper.find('p').text()).toBe('This is a health summary card');
    });

    it('should render with custom props', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Custom Title',
          description: 'Custom Description',
        },
      });

      expect(wrapper.find('h3').text()).toBe('Custom Title');
      expect(wrapper.find('p').text()).toBe('Custom Description');
    });
  });

  describe('Props Validation', () => {
    it('should validate required props', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Required Title',
          description: 'Required Description',
        },
      });

      expect(wrapper.props('title')).toBe('Required Title');
      expect(wrapper.props('description')).toBe('Required Description');
    });

    it('should have correct prop types', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'String Title',
          description: 'String Description',
        },
      });

      expect(typeof wrapper.props('title')).toBe('string');
      expect(typeof wrapper.props('description')).toBe('string');
    });
  });

  describe('DOM Structure', () => {
    it('should have correct DOM structure', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
      });

      // Check main container
      expect(wrapper.find('.rounded-lg').exists()).toBe(true);
      expect(wrapper.find('.shadow-md').exists()).toBe(true);
      expect(wrapper.find('.border').exists()).toBe(true);
      expect(wrapper.find('.border-gray-200').exists()).toBe(true);

      // Check header section
      expect(wrapper.find('.px-6').exists()).toBe(true);
      expect(wrapper.find('.py-4').exists()).toBe(true);
      expect(wrapper.find('.border-b').exists()).toBe(true);
      expect(wrapper.find('.bg-gray-50').exists()).toBe(true);
      expect(wrapper.find('.rounded-t-lg').exists()).toBe(true);

      // Check content section
      expect(wrapper.find('.p-4').exists()).toBe(true);
    });

    it('should render title and description in header', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Header Title',
          description: 'Header Description',
        },
      });

      const header = wrapper.find('.px-6');
      expect(header.find('h3').text()).toBe('Header Title');
      expect(header.find('p').text()).toBe('Header Description');
    });

    it('should have proper heading hierarchy', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Card Title',
          description: 'Card Description',
        },
      });

      const heading = wrapper.find('h3');
      expect(heading.exists()).toBe(true);
      expect(heading.classes()).toContain('text-lg');
      expect(heading.classes()).toContain('font-semibold');
      expect(heading.classes()).toContain('text-gray-900');
    });

    it('should have proper description styling', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Card Title',
          description: 'Card Description',
        },
      });

      const description = wrapper.find('p');
      expect(description.exists()).toBe(true);
      expect(description.classes()).toContain('text-sm');
      expect(description.classes()).toContain('text-gray-600');
      expect(description.classes()).toContain('mt-1');
    });
  });

  describe('Slot Content', () => {
    it('should render default slot content', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
        slots: {
          default: '<div class="slot-content">Default slot content</div>',
        },
      });

      expect(wrapper.find('.slot-content').exists()).toBe(true);
      expect(wrapper.find('.slot-content').text()).toBe('Default slot content');
    });

    it('should render complex slot content', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
        slots: {
          default: `
            <div class="complex-content">
              <h4>Nested Title</h4>
              <p>Nested paragraph</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          `,
        },
      });

      expect(wrapper.find('.complex-content').exists()).toBe(true);
      expect(wrapper.find('h4').text()).toBe('Nested Title');
      // Find the paragraph inside the complex content, not the description paragraph
      const complexContent = wrapper.find('.complex-content');
      expect(complexContent.find('p').text()).toBe('Nested paragraph');
      expect(wrapper.findAll('li')).toHaveLength(2);
    });

    it('should render multiple slot elements', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
        slots: {
          default: `
            <div class="slot-1">First slot</div>
            <div class="slot-2">Second slot</div>
          `,
        },
      });

      expect(wrapper.find('.slot-1').exists()).toBe(true);
      expect(wrapper.find('.slot-2').exists()).toBe(true);
      expect(wrapper.find('.slot-1').text()).toBe('First slot');
      expect(wrapper.find('.slot-2').text()).toBe('Second slot');
    });
  });

  describe('Styling and CSS Classes', () => {
    it('should apply correct CSS classes to main container', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
      });

      const container = wrapper.find('.rounded-lg');
      expect(container.classes()).toContain('rounded-lg');
      expect(container.classes()).toContain('shadow-md');
      expect(container.classes()).toContain('border');
      expect(container.classes()).toContain('border-gray-200');
    });

    it('should apply correct CSS classes to header', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
      });

      const header = wrapper.find('.px-6');
      expect(header.classes()).toContain('px-6');
      expect(header.classes()).toContain('py-4');
      expect(header.classes()).toContain('border-b');
      expect(header.classes()).toContain('border-gray-200');
      expect(header.classes()).toContain('bg-gray-50');
      expect(header.classes()).toContain('rounded-t-lg');
    });

    it('should apply correct CSS classes to content area', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
      });

      const content = wrapper.find('.p-4');
      expect(content.classes()).toContain('p-4');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Accessible Title',
          description: 'Accessible Description',
        },
      });

      const heading = wrapper.find('h3');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toBe('Accessible Title');
    });

    it('should have proper semantic structure', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Semantic Title',
          description: 'Semantic Description',
        },
      });

      // Check that title is in a heading element
      expect(wrapper.find('h3').exists()).toBe(true);
      
      // Check that description is in a paragraph element
      expect(wrapper.find('p').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title and description', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: '',
          description: '',
        },
      });

      expect(wrapper.find('h3').text()).toBe('');
      expect(wrapper.find('p').text()).toBe('');
    });

    it('should handle very long title and description', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly';
      const longDescription = 'This is a very long description that might cause layout issues if not handled properly and should be wrapped correctly';

      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: longTitle,
          description: longDescription,
        },
      });

      expect(wrapper.find('h3').text()).toBe(longTitle);
      expect(wrapper.find('p').text()).toBe(longDescription);
    });

    it('should handle special characters in title and description', () => {
      const specialTitle = 'Title with & special <characters> and "quotes"';
      const specialDescription = 'Description with & special <characters> and "quotes"';

      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: specialTitle,
          description: specialDescription,
        },
      });

      expect(wrapper.find('h3').text()).toBe(specialTitle);
      expect(wrapper.find('p').text()).toBe(specialDescription);
    });

    it('should handle whitespace in props', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: '   Title with spaces   ',
          description: '   Description with spaces   ',
        },
      });

      // Vue automatically trims whitespace in text content
      expect(wrapper.find('h3').text()).toBe('Title with spaces');
      expect(wrapper.find('p').text()).toBe('Description with spaces');
    });
  });

  describe('Component Structure', () => {
    it('should have correct component hierarchy', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
      });

      // Main container
      const mainContainer = wrapper.find('.rounded-lg');
      expect(mainContainer.exists()).toBe(true);

      // Header section
      const headerSection = mainContainer.find('.px-6');
      expect(headerSection.exists()).toBe(true);

      // Content section
      const contentSection = mainContainer.find('.p-4');
      expect(contentSection.exists()).toBe(true);
    });

    it('should maintain proper nesting', () => {
      const wrapper = mount(HealthSummaryCard, {
        props: {
          title: 'Test Title',
          description: 'Test Description',
        },
      });

      // Check that title and description are in the header section
      const header = wrapper.find('.px-6');
      expect(header.find('h3').exists()).toBe(true);
      expect(header.find('p').exists()).toBe(true);

      // Check that slot content is in the content section
      const content = wrapper.find('.p-4');
      expect(content.exists()).toBe(true);
    });
  });
});