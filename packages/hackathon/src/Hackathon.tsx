/*

 MIT License

 Copyright (c) 2020 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */
import React, { FC } from 'react'
import { Page, Layout, Aside, Section, MessageBar } from '@looker/components'
import { useSelector, useDispatch } from 'react-redux'

import { SideNav, Header } from './components'
import { AppRouter } from './routes'
import { getMessageState } from './data/common/selectors'
import { actionClearMessage } from './data/common/actions'

interface HackathonProps {}

export const Hackathon: FC<HackathonProps> = () => {
  const dispatch = useDispatch()
  const message = useSelector(getMessageState)

  const clearMessage = () => {
    dispatch(actionClearMessage())
  }

  return (
    <Page px="large">
      <Header />
      {message && (
        <MessageBar intent={message.intent} onPrimaryClick={clearMessage}>
          {message.messageText}
        </MessageBar>
      )}
      <Layout hasAside>
        <Aside width="10rem">
          <SideNav />
        </Aside>
        <Section>
          <AppRouter />
        </Section>
      </Layout>
    </Page>
  )
}
