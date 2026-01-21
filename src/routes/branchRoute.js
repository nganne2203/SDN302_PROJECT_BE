import { BRANCH_CONTROLLER } from '#controllers/branchController.js'
import express from 'express'

const router = express.Router()

router.get('/:id', BRANCH_CONTROLLER.getBranchById)

export const BRANCH_ROUTE = router
