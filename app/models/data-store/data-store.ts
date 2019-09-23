import { Instance, SnapshotOut, types, flow, getParentOfType } from "mobx-state-tree"
import { Coinbase, GetPriceResult } from "../../services/coinbase"
import { CurrencyType } from "./CurrencyType"
import { AccountType } from "../../screens/accounts-screen/AccountType"
import firebase from "react-native-firebase"


const getFiatBalance = firebase.functions().httpsCallable('getFiatBalances');
const db = firebase.firestore()                


export const Auth = types
    .model("Auth", {
        email: "nicolas.burtey+default@gmail.com",
        isAnonymous: false,
        uid: "", 
        emailVerified: false
    })
    .actions(self => {
        const set = (email: string, emailVerified: boolean, isAnonymous: boolean, uid: string) => {
            self.email = email
            self.emailVerified = emailVerified
            self.isAnonymous = isAnonymous
            self.uid = uid
        }

        const setEmail = (email: string) => {
            self.email = email
        }

        return { set, setEmail }
    })

export const TransactionModel = types
    .model ("Transaction", {
        name: types.string,
        icon: types.string,
        amount: types.number,
        date: types.Date,
        cashback: types.maybe(types.number),
        // TODO add status
    })

export const BaseAccountModel = types
    .model ("Account", {
        transactions: types.optional(types.array(TransactionModel), []),
        balance: 0,
    })

export const FiatFeaturesModel = BaseAccountModel
    .props ({
        type: types.optional(  // TODO check if this is succesfully forcing Fiat / Crypto classes?
            types.refinement(
                types.enumeration<AccountType>("Account Type", Object.values(AccountType)),
                value => value == AccountType.Checking
            ), 
            AccountType.Checking
        ),
    })
    .actions(self => {
        const update = flow(function*() {
            const uid = getParentOfType(self, DataStoreModel).auth.uid
            try {
                const doc = yield db.collection('users').doc(uid).get()
                self.transactions = doc.data().transactions // TODO better error management
            } catch(err) {
                console.tron.warn(err)
            }
        })

        const update_balances = flow(function*() { 
            try {
                var result = yield getFiatBalance({})
                if ("data" in result) {
                    let { data } = result
                    self.balance = data.Checking
                }
            } catch(err) {
                console.tron.log(err);
            }
        })

        const reset = () => { // TODO test
            self.transactions = [],
            self.balance = 0
        }

        return  { update, reset, update_balances }
    })
    .views(self => ({
        get currency() {
            return CurrencyType.USD
        },
    }))

export const CryptoFeaturesModel = BaseAccountModel
    .props ({
        type: types.optional(
            types.refinement(
                types.enumeration<AccountType>("Account Type", Object.values(AccountType)),
                value => value == AccountType.Bitcoin
            ),
            AccountType.Bitcoin
        )
    })
    .actions(self => {
        const update = flow(function*() {
            // TODO
        })
        const update_balances = flow(function*() { 
            // TODO
        })

        return  { update, update_balances }
    })
    .views(self => ({
        get currency() {
            return CurrencyType.BTC
        },
    }))


export const CheckingAccountModel = types.compose(BaseAccountModel, FiatFeaturesModel)
export const BitcoinAccountModel = types.compose(BaseAccountModel, CryptoFeaturesModel)

export const AccountModel = types.union(CheckingAccountModel, BitcoinAccountModel)


export const RatesModel = types
    .model("Rates", {
        USD: 1,  // TODO is there a way to have enum as parameter?
        BTC: 0.0001, // Satoshi to USD default value
    })
    .actions(self => {
        const update = flow(function*() {
            const api = new Coinbase()
            api.setup()
            const result: GetPriceResult = yield api.getPrice()
            if ("price" in result) {
                self.BTC = result.price
            } else {
                console.tron.warn("issue with price API")
                // TODO error management
            }
        })

        return  { update }
    })


export const DataStoreModel = types
    .model("DataStore", {
        auth: types.optional(Auth, {}),
        accounts: types.optional(types.array(AccountModel), () => 
            [
                CheckingAccountModel.create({type: AccountType.Checking}),
                BitcoinAccountModel.create({type: AccountType.Bitcoin}),
            ]
        ),
        rates: types.optional(RatesModel, {})
    })
    .actions(self => {
        const update = flow(function*() {
            // TODO
        })
        const update_balances = flow(function*() { 
            // TODO parrallel call?
            self.accounts.forEach((account) => account.update_balances())
        })

        return  { update, update_balances }
    })
    .views(self => ({
        get total_usd_balance() { // in USD
            return self.accounts.reduce((balance, account) => account.balance * self.rates[account.currency] + balance, 0)
        },

        get usd_balances() { // return an Object mapping account to USD balance
            const balances = {}

            self.accounts.forEach((account) => {
                balances[account.type] = account.balance * self.rates[account.currency]
            })
        
            return balances
        },

        account(accountType: AccountType) {  // this supposed a unique account for every type
            return self.accounts.filter(item => item.type === accountType)[0]
        }

    }))

  /**
  * Un-comment the following to omit model attributes from your snapshots (and from async storage).
  * Useful for sensitive data like passwords, or transitive state like whether a modal is open.

  * Note that you'll need to import `omit` from ramda, which is already included in the project!
  *  .postProcessSnapshot(omit(["password", "socialSecurityNumber", "creditCardNumber"]))
  */

type DataStoreType = Instance<typeof DataStoreModel>
export interface DataStore extends DataStoreType {}

type DataStoreSnapshotType = SnapshotOut<typeof DataStoreModel>
export interface DataStoreSnapshot extends DataStoreSnapshotType {}


type FiatAccountType = Instance<typeof CheckingAccountModel>
export interface FiatAccount extends FiatAccountType {}

type CryptoAccountType = Instance<typeof BitcoinAccountModel>
export interface CryptoAccount extends CryptoAccountType {}

type RatesType = Instance<typeof RatesModel>
export interface Rates extends RatesType {}