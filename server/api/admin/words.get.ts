import { WORD_CATALOG } from '../../../shared/word-catalog'
import { buildAdminWordReviewEntry } from '../../utils/words'

export default defineEventHandler(() => WORD_CATALOG.map(buildAdminWordReviewEntry))
