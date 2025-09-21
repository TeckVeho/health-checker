import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCard from '~/components/Molecules/cards/BaseCard.vue'

describe('BaseCard', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(BaseCard)
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('base-card')
    })

    it('renders with title', () => {
      const wrapper = mount(BaseCard, {
        props: {
          title: 'Test Card Title'
        }
      })
      
      expect(wrapper.text()).toContain('Test Card Title')
    })

    it('renders with description', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          description: 'Test card description'
        }
      })
      
      // デバッグ用
      console.log('Wrapper HTML:', wrapper.html())
      console.log('All props passed to mount:', { type: 'custom', description: 'Test card description' })
      console.log('Wrapper props:', wrapper.props())
      console.log('Component props:', wrapper.vm.$props)
      console.log('Component instance:', wrapper.vm)
      
      // プロパティが正しく渡されているか確認
      expect(wrapper.props('description')).toBe('Test card description')
      
      // ヘッダーセクションが存在するか確認
      expect(wrapper.find('.card-header').exists()).toBe(true)
      
      // description要素が存在するか確認
      expect(wrapper.find('.card-description').exists()).toBe(true)
      expect(wrapper.find('.card-description').text()).toBe('Test card description')
    })

    it('renders with both title and description', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          title: 'Test Card Title',
          description: 'Test card description'
        }
      })
      
      expect(wrapper.find('.card-title').text()).toBe('Test Card Title')
      expect(wrapper.find('.card-description').text()).toBe('Test card description')
      expect(wrapper.text()).toContain('Test Card Title')
      expect(wrapper.text()).toContain('Test card description')
    })
  })

  describe('variants', () => {
    it('renders with default variant', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card')
      expect(wrapper.classes()).toContain('base-card--custom')
      expect(wrapper.classes()).toContain('base-card--primary')
    })

    it('renders with primary variant', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          variant: 'primary'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card')
      expect(wrapper.classes()).toContain('base-card--custom')
      expect(wrapper.classes()).toContain('base-card--primary')
    })

    it('renders with secondary variant', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          variant: 'secondary'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--secondary')
    })

    it('renders with success variant', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          variant: 'success'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--success')
    })

    it('renders with warning variant', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          variant: 'warning'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--warning')
    })

    it('renders with danger variant', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          variant: 'danger'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--danger')
    })
  })

  describe('sizes', () => {
    it('renders with default size', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--md')
    })

    it('renders with small size', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          size: 'sm'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--sm')
    })

    it('renders with large size', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          size: 'lg'
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--lg')
    })
  })

  describe('states', () => {
    it('renders with loading state', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          loading: true
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--loading')
    })

    it('renders with disabled state', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          disabled: true
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--disabled')
    })

    it('renders with clickable state', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          clickable: true
        }
      })
      
      expect(wrapper.classes()).toContain('base-card--clickable')
    })
  })

  describe('slots', () => {
    it('renders default slot content', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom'
        },
        slots: {
          default: 'Card content'
        }
      })
      
      expect(wrapper.text()).toContain('Card content')
    })

    it('renders header slot content', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom'
        },
        slots: {
          header: 'Header content'
        }
      })
      
      expect(wrapper.text()).toContain('Header content')
    })

    it('renders footer slot content', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom'
        },
        slots: {
          footer: 'Footer content'
        }
      })
      
      expect(wrapper.text()).toContain('Footer content')
    })

    it('renders all slots together', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom'
        },
        slots: {
          header: 'Header content',
          default: 'Card content',
          footer: 'Footer content'
        }
      })
      
      expect(wrapper.text()).toContain('Header content')
      expect(wrapper.text()).toContain('Card content')
      expect(wrapper.text()).toContain('Footer content')
    })
  })

  describe('events', () => {
    it('emits click event when clicked', async () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          clickable: true
        }
      })
      
      await wrapper.trigger('click')
      
      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('does not emit click event when disabled', async () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          clickable: true,
          disabled: true
        }
      })
      
      await wrapper.trigger('click')
      
      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('emits hover events', async () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom'
        }
      })
      
      await wrapper.trigger('mouseenter')
      await wrapper.trigger('mouseleave')
      
      expect(wrapper.emitted('mouseenter')).toBeTruthy()
      expect(wrapper.emitted('mouseleave')).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          title: 'Test Card',
          ariaLabel: 'Test card label'
        }
      })
      
      expect(wrapper.attributes('aria-label')).toBe('Test card label')
    })

    it('has proper role attribute', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          role: 'article'
        }
      })
      
      expect(wrapper.attributes('role')).toBe('article')
    })
  })

  describe('custom styling', () => {
    it('applies custom class', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          customClass: 'custom-card-class'
        }
      })
      
      expect(wrapper.classes()).toContain('custom-card-class')
    })

    it('applies custom style', () => {
      const wrapper = mount(BaseCard, {
        props: {
          type: 'custom',
          customStyle: { backgroundColor: 'red' }
        }
      })
      
      expect(wrapper.attributes('style')).toContain('background-color: red')
    })
  })
})
