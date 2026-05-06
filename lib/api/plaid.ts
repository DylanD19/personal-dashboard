import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
})

export const plaidClient = new PlaidApi(config)

export async function createLinkToken() {
  const res = await plaidClient.linkTokenCreate({
    user: { client_user_id: 'dylan-personal' },
    client_name: "Dylan's Dashboard",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  })
  return res.data.link_token
}

export async function exchangePublicToken(publicToken: string) {
  const res = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
  return res.data
}

export async function getInstitutionName(itemId: string, accessToken: string): Promise<string> {
  try {
    const itemRes = await plaidClient.itemGet({ access_token: accessToken })
    const institutionId = itemRes.data.item.institution_id
    if (!institutionId) return 'Unknown Bank'
    const instRes = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us],
    })
    return instRes.data.institution.name
  } catch {
    return 'Unknown Bank'
  }
}

export async function syncTransactions(accessToken: string, cursor?: string) {
  const res = await plaidClient.transactionsSync({
    access_token: accessToken,
    cursor,
  })
  return res.data
}
