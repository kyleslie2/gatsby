// import { buildSchema } from "../schema"
import { build } from "../index"
import { GraphQLSchema, execute, parse } from "graphql"
import { setupLmdbStore } from "../../datastore/lmdb/lmdb-datastore"
import { store } from "../../redux"
import { actions } from "../../redux/actions"
import reporter from "gatsby-cli/lib/reporter"
import {
  createGraphQLRunner,
  Runner,
} from "../../bootstrap/create-graphql-runner"
// const { builtInFieldExtensions } = require(`./extensions`)

import type { IGatsbyPage, IGatsbyState } from "../../redux/types"
import { findPageByPath } from "../../utils/find-page-by-path"
import { getDataStore } from "../../datastore"

export class GraphQLEngine {
  // private schema: GraphQLSchema
  private runner: Runner

  constructor({ dbPath }: { dbPath: string }) {
    setupLmdbStore({ dbPath })
  }

  private async getRunner(): Promise<Runner> {
    if (!this.runner) {
      store.dispatch(actions.createTypes(SCHEMA_SNAPSHOT))

      await build({ fullMetadataBuild: false, freeze: true })
      // this.schema = await buildSchema({
      //   types: [{ typeOrTypeDef: SCHEMA_SNAPSHOT }, { name: `query-engine` }],
      // })

      // this.schema = store.getState().schema

      this.runner = createGraphQLRunner(store, reporter)
    }

    return this.runner
  }

  public async runQuery(...args): Promise<any> {
    return (await this.getRunner())(...args)
    // return execute({
    //   schema: await this.getSchema(),
    //   document: parse(wat),
    // })
  }

  public findPageByPath(pathname: string): IGatsbyPage | undefined {
    // adapter so `findPageByPath` use SitePage nodes in datastore
    // instead of `pages` redux slice
    const state = ({
      pages: {
        get(pathname: string): IGatsbyPage | undefined {
          return getDataStore().getNode(`SitePage ${pathname}`) as
            | IGatsbyPage
            | undefined
        },
        values(): Iterable<IGatsbyPage> {
          return getDataStore().iterateNodesByType(`SitePage`) as Iterable<
            IGatsbyPage
          >
        },
      },
    } as unknown) as IGatsbyState

    return findPageByPath(state, pathname, false)
  }
}