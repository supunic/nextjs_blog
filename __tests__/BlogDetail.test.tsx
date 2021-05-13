import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { getPage, initTestHelpers } from 'next-page-tester'

initTestHelpers()

process.env.NEXT_PUBLIC_RESTAPI_URL = 'http://127.0.0.1:8000/api'

const handlers = [
  rest.get(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/get-blogs/`,
    (req, res, ctx) => {
      return res(
        ctx.status(201),
        ctx.json([
          {
            id: 1,
            title: 'title1',
            content: 'content1',
            username: 'username1',
            tags: [
              { id: 1, name: 'tag1' },
              { id: 2, name: 'tag2' },
            ],
            created_at: '2021-01-12-10:00:00',
          },
          {
            id: 2,
            title: 'title2',
            content: 'content2',
            username: 'username2',
            tags: [
              { id: 1, name: 'tag1' },
              { id: 2, name: 'tag2' },
            ],
            created_at: '2021-01-12-10:00:00',
          },
        ])
      )
    }
  ),
  rest.get(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/get-blogs/1/`,
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          id: 1,
          title: 'title1',
          content: 'content1',
          username: 'username1',
          tags: [
            { id: 1, name: 'tag1' },
            { id: 2, name: 'tag2' },
          ],
          created_at: '2021-01-12-10:00:00',
        },)
      )
    }
  ),
  rest.get(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/get-blogs/2/`,
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          id: 1,
          title: 'title2',
          content: 'content2',
          username: 'username2',
          tags: [
            { id: 1, name: 'tag1' },
            { id: 2, name: 'tag2' },
          ],
          created_at: '2021-01-12-10:00:00',
        },)
      )
    }
  ),
]

const server = setupServer(...handlers)
beforeAll(() => {
  server.listen()
})
afterEach(() => {
  server.restoreHandlers()
  cleanup()
})
afterAll(() => {
  server.close()
})

describe('BlogDetailPage Test Cases', () => {
  // ブログid1の詳細ページ
  it('Should render detailed content of ID 1', async () => {
    const { page } = await getPage({
      route: '/posts/1',
    })
    render(page)
    expect(await screen.findByText('title1')).toBeInTheDocument()
    expect(screen.getByText('content1')).toBeInTheDocument()
    expect(screen.getByText('by username1')).toBeInTheDocument()
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
  })

  // ブログid2の詳細ページ
  it('Should render detailed content of ID 2', async () => {
    const { page } = await getPage({
      route: '/posts/2',
    })
    render(page)
    expect(await screen.findByText('title2')).toBeInTheDocument()
    expect(screen.getByText('content2')).toBeInTheDocument()
    expect(screen.getByText('by username2')).toBeInTheDocument()
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
  })

  // 詳細ページから一覧ページへの遷移
  it('Should route back to blog-page from detail page', async () => {
    const { page } = await getPage({
      route: '/posts/2',
    })
    render(page)
    await screen.findByText('title2')
    userEvent.click(screen.getByTestId('back-blog'))
    expect(await screen.findByText('blog page')).toBeInTheDocument()
  })
})
