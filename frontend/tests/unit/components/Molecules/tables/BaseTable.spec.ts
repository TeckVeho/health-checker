import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTable from '~/components/Molecules/tables/BaseTable.vue'

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: `
      <div class="p-datatable">
        <div v-if="loading" class="loading">Loading...</div>
        <div v-else-if="!value || value.length === 0" class="empty-state">
          <slot name="empty">No data available</slot>
        </div>
        <div v-else class="table-data">
          <div v-for="(item, index) in value" :key="index" class="table-row">
            {{ JSON.stringify(item) }}
          </div>
        </div>
        <div v-if="paginator" class="p-paginator">Paginator</div>
        <slot />
      </div>
    `,
    props: ['value', 'columns', 'sortField', 'sortOrder', 'loading', 'paginator', 'rows', 'totalRecords', 'lazy', 'pt']
  }
}))

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div class="p-column"><slot /></div>',
    props: ['field', 'header', 'sortable', 'pt']
  }
}))

vi.mock('primevue/paginator', () => ({
  default: {
    name: 'Paginator',
    template: '<div class="p-paginator">Paginator</div>',
    props: ['rows', 'totalRecords', 'first', 'onPage']
  }
}))

describe('BaseTable', () => {
  const mockData = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 300 }
  ]

  const mockColumns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'value', header: 'Value', sortable: true }
  ]

  describe('rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns
        }
      })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('base-table')
    })

    it('renders with title', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          title: 'Test Table'
        }
      })
      
      expect(wrapper.text()).toContain('Test Table')
    })

    it('renders with description', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          description: 'Test table description'
        }
      })
      
      expect(wrapper.text()).toContain('Test table description')
    })
  })

  describe('data display', () => {
    it('displays data correctly', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns
        }
      })
      
      expect(wrapper.text()).toContain('Item 1')
      expect(wrapper.text()).toContain('Item 2')
      expect(wrapper.text()).toContain('Item 3')
    })

    it('displays empty state when no data', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: [],
          columns: mockColumns
        }
      })
      
      expect(wrapper.text()).toContain('No data available')
    })

    it('displays loading state', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          loading: true
        }
      })
      
      expect(wrapper.text()).toContain('Loading...')
    })
  })

  describe('sorting', () => {
    it('handles sort field changes', async () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          sortField: 'name',
          sortOrder: 'asc'
        }
      })
      
      expect(wrapper.props('sortField')).toBe('name')
      expect(wrapper.props('sortOrder')).toBe('asc')
    })

    it('emits sort event', async () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns
        }
      })
      
      await wrapper.vm.$emit('sort', { field: 'name', order: 'asc' })
      
      expect(wrapper.emitted('sort')).toBeTruthy()
    })
  })

  describe('pagination', () => {
    it('renders with pagination', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          paginator: true,
          rows: 10,
          totalRecords: 100
        }
      })
      
      expect(wrapper.find('.p-paginator').exists()).toBe(true)
    })

    it('handles page changes', async () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          paginator: true,
          rows: 10,
          totalRecords: 100
        }
      })
      
      await wrapper.vm.$emit('page', { page: 1, first: 10 })
      
      expect(wrapper.emitted('page')).toBeTruthy()
    })
  })

  describe('variants', () => {
    it('renders with default variant', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom'
        }
      })
      
      expect(wrapper.classes()).toContain('base-table--default')
    })

    it('renders with striped variant', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          variant: 'striped'
        }
      })
      
      expect(wrapper.classes()).toContain('base-table--striped')
    })

    it('renders with bordered variant', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          variant: 'bordered'
        }
      })
      
      expect(wrapper.classes()).toContain('base-table--bordered')
    })
  })

  describe('sizes', () => {
    it('renders with default size', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom'
        }
      })
      
      expect(wrapper.classes()).toContain('base-table--md')
    })

    it('renders with small size', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          size: 'sm'
        }
      })
      
      expect(wrapper.classes()).toContain('base-table--sm')
    })

    it('renders with large size', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          size: 'lg'
        }
      })
      
      expect(wrapper.classes()).toContain('base-table--lg')
    })
  })

  describe('slots', () => {
    it('renders default slot content', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom'
        },
        slots: {
          default: 'Table content'
        }
      })
      
      expect(wrapper.text()).toContain('Table content')
    })

    it('renders header slot content', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom'
        },
        slots: {
          header: 'Header content'
        }
      })
      
      expect(wrapper.text()).toContain('Header content')
    })

    it('renders footer slot content', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom'
        },
        slots: {
          footer: 'Footer content'
        }
      })
      
      expect(wrapper.text()).toContain('Footer content')
    })
  })

  describe('events', () => {
    it('emits row click event', async () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom'
        }
      })
      
      await wrapper.vm.$emit('row-click', { data: mockData[0] })
      
      expect(wrapper.emitted('row-click')).toBeTruthy()
    })

    it('emits selection change event', async () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom'
        }
      })
      
      await wrapper.vm.$emit('selection-change', { data: [mockData[0]] })
      
      expect(wrapper.emitted('selection-change')).toBeTruthy()
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          ariaLabel: 'Test table label'
        }
      })
      
      expect(wrapper.attributes('aria-label')).toBe('Test table label')
    })

    it('has proper role attribute', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          role: 'table'
        }
      })
      
      expect(wrapper.attributes('role')).toBe('table')
    })
  })

  describe('custom styling', () => {
    it('applies custom class', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          customClass: 'custom-table-class'
        }
      })
      
      expect(wrapper.classes()).toContain('custom-table-class')
    })

    it('applies custom style', () => {
      const wrapper = mount(BaseTable, {
        props: {
          data: mockData,
          columns: mockColumns,
          type: 'custom',
          customStyle: { backgroundColor: 'red' }
        }
      })
      
      expect(wrapper.attributes('style')).toContain('background-color: red')
    })
  })
})
