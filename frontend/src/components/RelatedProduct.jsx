import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from "../components/Title"
import ProductItem from "../components/ProductItem" 

const RelatedProduct = ({category, subCategory}) => {
    const {products} = useContext(ShopContext);
    const[related, setRelated] = useState([]);
    useEffect(()=>{
        if(products.length > 0){
            let pCopy = products.slice();
            pCopy = pCopy.filter((item)=> category === item.category);
            pCopy = pCopy.filter((item) => subCategory === item.subCategory);
            setRelated(pCopy.slice(0,5));
        }
    },[products])
    return (
    <div>
      <div className='my-24'>
        <div className='text-center text-3xl py-2'>
            <Title text1={'RELATED'} text2 = {'PRODUCTS'}/>
        </div>
        <div className='gird gird-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
            {related.map((item,index)=>(<ProductItem key={index} id={item._id} name={item.name} image={item.image}/>))}
        </div>
      </div>
    </div>
  )
}

export default RelatedProduct
