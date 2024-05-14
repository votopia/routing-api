import { Token } from "@votopia/sdk-core";
import { BigNumber } from "ethers";

export interface MarshalledToken {
  address: string;
  decimals: number;
  symbol?: string;
  name?: string;
  buyFeeBps?: string;
  sellFeeBps?: string;
}

export class TokenMarshaller {
  public static marshal(token: Token): MarshalledToken {
    return {
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name,
      buyFeeBps: token.buyFeeBps?.toString(),
      sellFeeBps: token.sellFeeBps?.toString(),
    };
  }

  public static unmarshal(marshalledToken: MarshalledToken): Token {
    return new Token(
      marshalledToken.address,
      marshalledToken.decimals,
      marshalledToken.symbol || "Unknown",
      marshalledToken.name || "Unkown",
      `https://assets.smold.app/api/token/${marshalledToken.address}`, // at this point we know it's valid token address,
      undefined,
      marshalledToken.buyFeeBps ? BigNumber.from(marshalledToken.buyFeeBps) : undefined,
      marshalledToken.sellFeeBps ? BigNumber.from(marshalledToken.sellFeeBps) : undefined
    );
  }
}
