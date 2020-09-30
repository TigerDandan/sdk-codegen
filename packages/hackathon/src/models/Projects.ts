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

import {
  IRowModel,
  ITabTable,
  noDate,
  RowModel,
  SheetSDK,
  WhollySheet,
} from '@looker/wholly-sheet'

import { DelimArray } from '@looker/sdk-rtl'

/** IMPORTANT: properties must be declared in the tab sheet's columnar order, not sorted order */
export interface IProject extends IRowModel {
  registration_id: string
  title: string
  description: string
  date_created: Date
  project_type: string
  contestant: boolean
  locked: boolean
  technologies: DelimArray<string>
}

/** IMPORTANT: properties must be declared in the tab sheet's columnar order, not sorted order */
export class Project extends RowModel<IProject> {
  registration_id = ''
  title = ''
  description = ''
  date_created: Date = noDate
  project_type = ''
  contestant = true
  locked = false
  technologies: DelimArray<string> = new DelimArray<string>([])
  constructor(values?: any) {
    super()
    // IMPORTANT: this must be done after super() constructor is called so keys are established
    // there may be a way to overload the constructor so this isn't necessary but pattern hasn't been found
    this.assign(values)
  }
}

export class Projects extends WhollySheet<IProject> {
  constructor(
    public readonly sheets: SheetSDK,
    public readonly table: ITabTable
  ) {
    super(sheets, 'projects', table, 'id') //, { new Hackathon(values?: any)})
  }

  typeRows<T extends IRowModel>(rows: any[]): T[] {
    const result: T[] = []

    rows.forEach((r) => {
      const row: T = (new Project(r) as unknown) as T
      result.push(row)
    })

    return result
  }
}