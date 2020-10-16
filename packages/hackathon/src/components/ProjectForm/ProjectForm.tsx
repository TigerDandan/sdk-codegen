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

import React, {
  BaseSyntheticEvent,
  FC,
  FormEvent,
  useEffect,
  useState,
} from 'react'
import {
  Form,
  Fieldset,
  FieldText,
  FieldTextArea,
  FieldToggleSwitch,
  FieldSelect,
  FieldSelectMulti,
  Button,
  ButtonOutline,
  Space,
  ValidationMessages,
} from '@looker/components'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { Hacker, Project, Hackathon } from '../../models'
import { actionMessage } from '../../data/common/actions'
import {
  currentProjectsRequest,
  updateProjectRequest,
  createProjectRequest,
  changeMembership,
} from '../../data/projects/actions'
import {
  getCurrentHackathonState,
  getHackerState,
  getTechnologies,
} from '../../data/hack_session/selectors'
import {
  getCurrentProjectsState,
  getProjectsLoadedState,
} from '../../data/projects/selectors'
import { allHackersRequest } from '../../data/hackers/actions'
import { getJudgesState } from '../../data/hackers/selectors'
import { Routes } from '../../routes/AppRouter'
import { isLoadingState, getMessageState } from '../../data/common/selectors'

interface ProjectDialogProps {}

interface ModifiedJudges {
  addedJudges: Hacker[]
  deletedJudges: Hacker[]
}

enum ChangeMemberShipType {
  leave = 'leave',
  join = 'join',
  nochange = 'nochange',
}

const canUpdateProject = (
  hacker: Hacker,
  project?: Project,
  func?: string
): boolean => {
  if (hacker.canAdmin() || hacker.canJudge() || hacker.canStaff()) {
    return true
  }
  if (
    func === 'new' ||
    (project && project?._user_id === hacker.id && !project.locked)
  ) {
    return true
  }
  return false
}

export const canLockProject = (hacker: Hacker) =>
  hacker.canAdmin() || hacker.canJudge() || hacker.canStaff()

const validate = (moreInfo: string): ValidationMessages | undefined => {
  // TODO improve validation
  if (
    // Go figure with this but its happening!
    !moreInfo ||
    moreInfo === '\0' ||
    moreInfo.trim() === '' ||
    moreInfo.startsWith('http://') ||
    moreInfo.startsWith('https://')
  ) {
    return undefined
  } else {
    return {
      moreInfo: { type: 'error', message: 'More info must be a URL' },
    }
  }
}

const changeMemberShip = (
  hacker: Hacker,
  hackathon?: Hackathon,
  project?: Project
): ChangeMemberShipType => {
  if (project && !project.locked && hackathon) {
    if (project.findMember(hacker)) {
      return ChangeMemberShipType.leave
    } else if (project.$team.length < hackathon.max_team_size) {
      return ChangeMemberShipType.join
    }
  }
  return ChangeMemberShipType.nochange
}

const getModifiedJudges = (
  availableJudges: Hacker[],
  oldJudgeNames: string[],
  newJudgeNames: string[]
): ModifiedJudges => {
  const deletedJudgeNames = oldJudgeNames
    .filter((oldJudgeName) => !newJudgeNames.includes(oldJudgeName))
    .filter(
      (judgeName) =>
        !!availableJudges.find(
          (availableJudge) => availableJudge.name === judgeName
        )
    )
  const addedJudgeNames = newJudgeNames
    .filter((newJudgeName) => !oldJudgeNames.includes(newJudgeName))
    .filter(
      (judgeName) =>
        !!availableJudges.find(
          (availableJudge) => availableJudge.name === judgeName
        )
    )
  return {
    addedJudges: addedJudgeNames.map(
      (judgeName) =>
        availableJudges.find(
          (availableJudge) => availableJudge.name === judgeName
        )!
    ),
    deletedJudges: deletedJudgeNames.map(
      (judgeName) =>
        availableJudges.find(
          (availableJudge) => availableJudge.name === judgeName
        )!
    ),
  }
}

export const ProjectForm: FC<ProjectDialogProps> = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const match = useRouteMatch<{ func: string }>('/projects/:func')
  const hackathon = useSelector(getCurrentHackathonState)
  const hacker = useSelector(getHackerState)
  const projects = useSelector(getCurrentProjectsState)
  const projectsLoaded = useSelector(getProjectsLoadedState)
  const isLoading = useSelector(isLoadingState)
  const messageDetail = useSelector(getMessageState)
  const availableTechnologies = useSelector(getTechnologies)
  const availableJudges = useSelector(getJudgesState)

  const [project, setProject] = useState<Project>()
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [projectType, setProjectType] = useState<string>('Open')
  const [contestant, setContestant] = useState<boolean>(false)
  const [locked, setLocked] = useState<boolean>(false)
  const [technologies, setTechnologies] = useState<string[]>([])
  const [moreInfo, setMoreInfo] = useState<string>('')
  const [members, setMembers] = useState<string[]>([])
  const [judges, setJudges] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const func = match?.params?.func
  const canUpdate = canUpdateProject(hacker, project, func)
  const canLock = canLockProject(hacker)
  const validationMessages = validate(moreInfo)
  const changeMemberShipType = changeMemberShip(hacker, hackathon, project)

  useEffect(() => {
    dispatch(currentProjectsRequest())
    dispatch(allHackersRequest())
  }, [dispatch])

  useEffect(() => {
    if (func) {
      let project
      if (hacker && hacker.registration && hacker.registration._id) {
        if (func === 'new') {
          project = new Project({
            _user_id: hacker.id,
            _hackathon_id: hackathon ? hackathon._id : '',
          })
          project._user_id = hacker.registration?._id
        } else if (projects.rows) {
          project = projects.rows.find((project) => project._id === func)
        }
        if (project) {
          if (!project._hackathon_id) {
            // Self correct missing registration for now
            project._hackathon_id = hackathon ? hackathon._id : ''
          }
          setTitle(project.title)
          setDescription(project.description)
          setProjectType(project.project_type)
          setContestant(project.contestant)
          setLocked(project.locked)
          setTechnologies(project.technologies)
          setMoreInfo(project.more_info)
          setMembers(project.$members)
          setJudges(project.$judges)
          setProject(project)
        } else {
          if (projectsLoaded) {
            dispatch(actionMessage('Invalid project', 'critical'))
          }
        }
      } else {
        dispatch(actionMessage('Hacker has not been registered', 'critical'))
      }
    }
  }, [func, hacker, dispatch, projects, projectsLoaded])

  useEffect(() => {
    if (isUpdating && !isLoading && !messageDetail) {
      history.push(Routes.PROJECTS)
    }
  }, [isLoading, isUpdating, history])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate(moreInfo)) {
      return
    }
    if (project) {
      project.title = title
      project.description = description
      project.project_type = projectType
      project.contestant = contestant
      project.locked = locked
      project.technologies = technologies
      project.more_info = moreInfo
      const modifiedJudges = getModifiedJudges(
        availableJudges,
        project.$judges,
        judges
      )
      modifiedJudges.addedJudges.forEach((judge) => project.addJudge(judge))
      modifiedJudges.deletedJudges.forEach((judge) =>
        project.deleteJudge(judge)
      )
      if (func === 'new') {
        dispatch(createProjectRequest(hacker.id, projects, project))
      } else {
        dispatch(updateProjectRequest(projects, project))
      }
      setIsUpdating(true)
    }
  }

  const handleCancel = () => {
    history.push(Routes.PROJECTS)
  }

  const updateMembershipClick = (e: FormEvent) => {
    e.preventDefault()
    if (project) {
      dispatch(
        changeMembership(
          project,
          hacker,
          changeMemberShipType === ChangeMemberShipType.leave
        )
      )
      setIsUpdating(true)
    }
  }

  return (
    <>
      {project && (
        <Form
          onSubmit={handleSubmit}
          width="40vw"
          mt="large"
          validationMessages={validationMessages}
        >
          <Fieldset legend="Enter your project details">
            <FieldText
              disabled={!canUpdate}
              required
              name="title"
              label="Title"
              defaultValue={title}
              onChange={(e: BaseSyntheticEvent) => {
                setTitle(e.target.value)
              }}
            />
            <FieldTextArea
              disabled={!canUpdate}
              required
              label="Description"
              name="description"
              defaultValue={description}
              onChange={(e: BaseSyntheticEvent) => {
                setDescription(e.target.value)
              }}
            />
            <FieldSelect
              disabled={!canUpdate}
              id="projectType"
              label="Type"
              required
              defaultValue={projectType}
              options={[
                { value: 'Open' },
                { value: 'Closed' },
                { value: 'Invite Only' },
              ]}
              onChange={(value: string) => {
                setProjectType(value)
              }}
            />
            <FieldToggleSwitch
              disabled={!canUpdate}
              name="contestant"
              label="Contestant"
              onChange={(e: BaseSyntheticEvent) => {
                setContestant(e.target.checked)
              }}
              on={contestant}
            />
            <FieldToggleSwitch
              disabled={!canLock}
              name="locked"
              label="Lock"
              onChange={(e: BaseSyntheticEvent) => {
                setLocked(e.target.checked)
              }}
              on={locked || false}
            />
            <FieldSelectMulti
              disabled={!canUpdate}
              id="technologies"
              label="Technologies"
              required
              options={availableTechnologies?.rows.map((row) => ({
                value: row._id,
              }))}
              isFilterable
              placeholder="Type values or select from the list"
              defaultValues={technologies}
              onChange={(values: string[] = []) => {
                setTechnologies(values)
              }}
            />
            <FieldText
              disabled={!canUpdate}
              name="moreInfo"
              label="More information"
              defaultValue={moreInfo}
              onChange={(e: BaseSyntheticEvent) => {
                setMoreInfo(e.target.value)
              }}
            />
            <FieldSelectMulti
              disabled={true}
              id="members"
              label="Members"
              defaultValues={members}
            />
          </Fieldset>
          <FieldSelectMulti
            disabled={!hacker.canAdmin()}
            id="judges"
            label="Judges"
            options={availableJudges.map((judge) => ({
              value: `${judge.name}`,
            }))}
            isFilterable
            placeholder="Type values or select from the list"
            defaultValues={judges}
            onChange={(values: string[] = []) => {
              setJudges(values)
            }}
          />
          <Space between width="100%">
            <Space>
              <ButtonOutline
                type="button"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                Return
              </ButtonOutline>
              <Button type="submit" disabled={!canUpdate || isUpdating}>
                Save
              </Button>
            </Space>
            {changeMemberShipType !== ChangeMemberShipType.nochange && (
              <ButtonOutline
                onClick={updateMembershipClick}
                disabled={isUpdating}
              >
                {changeMemberShipType === ChangeMemberShipType.leave
                  ? 'Leave project'
                  : 'Join project'}
              </ButtonOutline>
            )}
          </Space>
        </Form>
      )}
    </>
  )
}
