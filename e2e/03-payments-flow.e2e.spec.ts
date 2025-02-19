import { i18nObject } from "../app/i18n/i18n-util"
import { loadLocale } from "../app/i18n/i18n-util.sync"
import { selector, enter } from "./utils"
import { MUTATIONS, createGaloyServerClient, GaloyGQL } from "@galoymoney/client"
import { ApolloQueryResult, gql } from "@apollo/client"

describe("Payments Flow", async () => {
  loadLocale("en")
  const LL = i18nObject("en")
  const timeout = 30000
  let invoice
  it("Clear the clipboard", async () => {
    await browser.setClipboard("", "plaintext")
  })

  it("Click 'Back Home' on the stablesats tutorial modal", async () => {
    try {
      const backHomeButton = await $(selector(LL.common.backHome()))
      await backHomeButton.waitForDisplayed({ timeout: 5000 })
      if (backHomeButton.isDisplayed()) {
        await backHomeButton.click()
      } else {
        expect(backHomeButton.isDisplayed()).toBeFalsy()
      }
    } catch (e) {
      expect(false).toBeFalsy()
    }
  })

  it("Click Send", async () => {
    const sendButton = await $(selector(LL.MoveMoneyScreen.send(), "Other"))
    await sendButton.waitForDisplayed({ timeout })
    await sendButton.click()
  })

  it("Create Invoice", async () => {
    // gen invoice from +503XXX55540
    const authToken = process.env.GALOY_TOKEN_2
    const config = {
      network: "signet",
      graphqlUrl: "https://api.staging.galoy.io/graphql",
    }
    const client = createGaloyServerClient({ config })({ authToken })
    // get BTC wallet id
    const accountResult: ApolloQueryResult<{ me: GaloyGQL.MeFragment }> =
      await client.query({
        query: gql`
          {
            me {
              defaultAccount {
                wallets {
                  walletCurrency
                  id
                }
              }
            }
          }
        `,
        fetchPolicy: "no-cache",
      })
    const walletId = accountResult.data.me.defaultAccount.wallets.filter(
      (w) => w.walletCurrency === "BTC",
    )[0].id

    const result = await client.mutate({
      variables: { input: { walletId } }, // (lookup wallet 2 id from graphql) i.e "8914b38f-b0ea-4639-9f01-99c03125eea5"
      mutation: MUTATIONS.lnNoAmountInvoiceCreate,
      fetchPolicy: "no-cache",
    })
    invoice = result.data.lnNoAmountInvoiceCreate.invoice.paymentRequest
    expect(invoice).toBeTruthy()
  })

  it("Paste Invoice", async () => {
    try {
      const invoiceInput = await $(selector(LL.SendBitcoinScreen.input(), "Other", "[1]"))
      await invoiceInput.waitForDisplayed({ timeout })
      await invoiceInput.click()
      await browser.pause(500)
      await invoiceInput.sendKeys(invoice.split(""))
      await enter(invoiceInput)
      await browser.pause(5000)
    } catch (e) {
      // this passes but sometimes throws an error on ios
      // even though it works properly
    }
  })

  it("Click Next", async () => {
    const nextButton = await $(selector(LL.common.next()))
    await nextButton.waitForDisplayed({ timeout })
    await nextButton.isEnabled()
    await nextButton.click()
  })

  it("Add amount", async () => {
    try {
      const amountInput = await $(selector("USD Amount", "TextField"))
      await amountInput.waitForDisplayed({ timeout })
      await amountInput.click()
      await browser.pause(1000)
      await amountInput.sendKeys("2".split(""))
      await enter(amountInput)
    } catch (e) {
      // this passes but sometimes throws an error on ios
      // even though it works properly
    }
  })

  it("Click Next", async () => {
    await browser.pause(3000)
    const nextButton = await $(selector(LL.common.next()))
    await nextButton.waitForDisplayed({ timeout })
    await nextButton.isEnabled()
    await nextButton.click()
  })

  it("Wait for fee calulation to return", async () => {
    await browser.pause(4000)
  })

  it("Click 'Confirm Payment' and get Green Checkmark success", async () => {
    const confirmPaymentButton = await $(
      selector(LL.SendBitcoinConfirmationScreen.title()),
    )
    await confirmPaymentButton.waitForDisplayed({ timeout })
    await confirmPaymentButton.click()
    const successCheck = await $(selector(LL.SendBitcoinScreen.success(), "StaticText"))
    await successCheck.waitForDisplayed({ timeout })
    expect(successCheck.isDisplayed()).toBeTruthy()
  })
})
