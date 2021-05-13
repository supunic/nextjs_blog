import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { getPage, initTestHelpers } from 'next-page-tester'

initTestHelpers()

process.env.NEXT_PUBLIC_RESTAPI_URL = 'http://127.0.0.1:8000/api'

// モックサーバーのapiを用意
const handlers = [
  rest.post(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/jwt/create/`,
    (req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ access: '123xyz' }))
    }
  ),
  rest.post(
    `${process.env.NEXT_PUBLIC_RESTAPI_URL}/register/`,
    (req, res, ctx) => {
      return res(ctx.status(201))
    }
  ),
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
]

// モックサーバの立ち上げ
const server = setupServer(...handlers)
beforeAll(() => {
  server.listen()
})
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => {
  server.close()
})

describe('AdminPage Test Cases', () => {
  // ログイン成功時
  it('Should route to index-page when login succeeded', async () => {
    const { page } = await getPage({
      route: '/admin-page'
    })
    render(page)
    expect(await screen.findByText('Login')).toBeInTheDocument() // ページが表示されているか評価
    userEvent.type(screen.getByPlaceholderText('Username'), 'user1') // user1とフォームに入力
    userEvent.type(screen.getByPlaceholderText('Password'), 'dummypw') // dummypwとフォームに入力
    userEvent.click(screen.getByText('Login with JWT')) // ボタンクリック
    expect(await screen.findByText('blog page')).toBeInTheDocument() // ログイン後のページが表示されているか評価
  })

  // ログイン失敗時
  it('Should not route to index-page when login is failed', async () => {
    server.use(
      rest.post(
        `${process.env.NEXT_PUBLIC_RESTAPI_URL}/jwt/create/`,
        (req, res, ctx) => {
          return res(ctx.status(400)) // エラーに設定
        }
      )
    )
    const { page } = await getPage({
      route: '/admin-page'
    })
    render(page)
    expect(await screen.findByText('Login')).toBeInTheDocument()
    userEvent.type(screen.getByPlaceholderText('Username'), 'user1')
    userEvent.type(screen.getByPlaceholderText('Password'), 'dummypw')
    userEvent.click(screen.getByText('Login with JWT'))
    expect(await screen.findByText('Login Error'))
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('blog page')).toBeNull()
  })

  // loginとregisterの切り替え
  it('Should change to register mode', async () => {
    const { page } = await getPage({
      route: '/admin-page',
    })
    render(page)
    expect(await screen.findByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Login with JWT')).toBeInTheDocument()
    userEvent.click(screen.getByTestId('mode-change'))
    expect(screen.getByText('Sign up')).toBeInTheDocument()
    expect(screen.getByText('Create new user')).toBeInTheDocument()
  })

  // register成功時
  it('Should route to index-page when register+login succeeded', async () => {
    const { page } = await getPage({
      route: '/admin-page',
    })
    render(page)
    expect(await screen.findByText('Login')).toBeInTheDocument()
    userEvent.click(screen.getByTestId('mode-change'))
    userEvent.type(screen.getByPlaceholderText('Username'), 'user1')
    userEvent.type(screen.getByPlaceholderText('Password'), 'dummypw')
    userEvent.click(screen.getByText('Create new user'))
    expect(await screen.findByText('blog page')).toBeInTheDocument()
  })

  // register失敗時
  it('Should not route to index-page when registration is failed', async () => {
    server.use(
      rest.post(
        `${process.env.NEXT_PUBLIC_RESTAPI_URL}/register/`,
        (req, res, ctx) => {
          return res(ctx.status(400)) // エラーに設定
        }
      )
    )
    const { page } = await getPage({
      route: '/admin-page',
    })
    render(page)
    expect(await screen.findByText('Login')).toBeInTheDocument()
    userEvent.click(screen.getByTestId('mode-change'))
    userEvent.type(screen.getByPlaceholderText('Username'), 'user1')
    userEvent.type(screen.getByPlaceholderText('Password'), 'dummypw')
    userEvent.click(screen.getByText('Create new user'))
    expect(await screen.findByText('Registration Error'))
    expect(screen.getByText('Sign up')).toBeInTheDocument()
    expect(screen.queryByText('blog page')).toBeNull()
  })
})
