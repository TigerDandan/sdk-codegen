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

import { ITabTable, noDate, SheetSDK, WhollySheet } from '@looker/wholly-sheet'
import { ISheetRow, SheetRow } from './SheetRow'
import { Hackathon } from './Hackathons'

/** IMPORTANT: properties must be declared in the tab sheet's columnar order, not sorted order */
export interface IRegistration extends ISheetRow {
  _user_id: string
  hackathon_id: string
  date_registered: Date
  attended: boolean
}

/** IMPORTANT: properties must be declared in the tab sheet's columnar order, not sorted order */
export class Registration extends SheetRow<IRegistration> {
  _user_id = ''
  hackathon_id = ''
  date_registered: Date = noDate
  attended = false
  constructor(values?: any) {
    super()
    // IMPORTANT: this must be done after super() constructor is called so keys are established
    // there may be a way to overload the constructor so this isn't necessary but pattern hasn't been found
    this.assign(values)
  }

  prepare(): IRegistration {
    super.prepare()
    if (this.date_registered === noDate) this.date_registered = new Date()
    // Current behavior is, if this registration record exists, the user attended because they're using the extension
    this.attended = true
    return this
  }
}

export class Registrations extends WhollySheet<Registration> {
  constructor(
    public readonly sheets: SheetSDK,
    public readonly table: ITabTable
  ) {
    super(sheets, 'registrations', table)
  }

  typeRow<Registration>(values?: any) {
    return (new Registration(values) as unknown) as Registration
  }

  hackRegs(hackathon: Hackathon) {
    return this.rows.filter((r) => r.hackathon_id === hackathon._id)
  }
}
