import { createContext } from "react";
import {products} from "../assets/assets"

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const currency = '$';
    const delievery_fee = 10;

    const value = {
        products
    }
    return (
        <ShopContext.Provider value = {value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;