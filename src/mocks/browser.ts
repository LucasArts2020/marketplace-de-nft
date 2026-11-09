import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw'
import { catalogHandlers } from './catalog'
import { commerceHandlers } from './commerce'
import { socketHandlers } from './socket'
import { resetCommerce } from './commerce-store'

export const worker = setupWorker(...catalogHandlers, ...commerceHandlers, ...socketHandlers,
  http.post('/__demo/reset', async () => {
    await resetCommerce()
    return new HttpResponse(null, { status: 204 })
  }),
)
