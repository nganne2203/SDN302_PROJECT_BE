import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { BRANCH_VALIDATION } from '#validations/branchValidation.js'

export const CREATE_BRANCH_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  BRANCH_VALIDATION.createBranch
)

export const CREATE_BRANCH_REQUIRED = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  BRANCH_VALIDATION.createBranch
)

export const UPDATE_BRANCH_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  BRANCH_VALIDATION.updateBranch
)

export const QUERY_BRANCH_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  BRANCH_VALIDATION.query
)

export const ASSIGN_BRANCH_MANAGER_FIELDS = GENERATE_UTILS.extractFieldsFromJoi(
  BRANCH_VALIDATION.assignManager
)

export const UPDATE_BRANCH_STATUS = GENERATE_UTILS.extractFieldsFromJoi(
  BRANCH_VALIDATION.updateBranchStatus
)