import { GENERATE_UTILS } from '#utils/generateUtil.js'
import { STORE_INVENTORY_VALIDATION } from '#validations/storeInventoryValidation.js'

const CREATE_STORE_INVENTORY = GENERATE_UTILS.extractFieldsFromJoi(
  STORE_INVENTORY_VALIDATION.createStoreInventory
)

const CREATE_STORE_INVENTORY_REQUIRED = GENERATE_UTILS.extractRequiredFieldsFromJoi(
  STORE_INVENTORY_VALIDATION.createStoreInventory
)

export const STORE_INVENTORY_CONSTANT = {
  CREATE_STORE_INVENTORY,
  CREATE_STORE_INVENTORY_REQUIRED
}