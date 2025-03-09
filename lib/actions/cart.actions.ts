// 'use server';

// import { CartItem } from '@/types';
//import { cookies } from 'next/headers';
// import { roundNumber } from '../utils';
// import { formatError, prismaToJSObject } from '../utils';
// import { auth } from '@/auth';
// import { prisma } from '@/lib/db/config';
// import { cartItemSchema, insertCartSchema } from '../validators';
// import { revalidatePath } from 'next/cache';
// import { Prisma } from '@prisma/client';
// import { getUserById } from './user.actions';


// Calculate cart prices
// const calcPrice = (items: CartItem[]) => {

//     const itemsPrice = roundNumber(items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0));
//     const shippingPrice = roundNumber(itemsPrice > 100 ? 0 : 10);
//     const taxPrice = roundNumber(itemsPrice * 0.15);
//     const totalPrice = roundNumber(itemsPrice + shippingPrice + taxPrice);

//     return {
//         itemsPrice: itemsPrice.toFixed(2),
//         shippingPrice: shippingPrice.toFixed(2),
//         taxPrice: taxPrice.toFixed(2),
//         totalPrice: totalPrice.toFixed(2)
//     };
// }





// export async function addItemToCart(data: CartItem) {

//     try {
//         //Get the cart id from the session cookie
//         const sessionCartId = (await cookies()).get('sessionCartId')?.value;
//         if (!sessionCartId) {
//             throw new Error('Session cart id not found');
//         }
//         //Get Seesion cart id as well as user id
//         const session = await auth();
//         //Get the user id from the session and display undefined instead of an error if it isnt found
//         const userId = session?.user?.id ? (session.user.id as string) : undefined;

//         //Get Cart items from the database
//         const cart = await getMyCart();
//         // console.log(cart)

//         //Parse and validate data being passed
//         const item = cartItemSchema.parse(data);

//         //Find the product in the DB
//         const product = await prisma.product.findUnique({
//             where: { id: item.productId }
//         });

//         if (!product) throw new Error('Product not found');
//         //Check if the item is already in the cart
//         if (!cart) {
//             ///Create a new cart object
//             const newCart = insertCartSchema.parse({
//                 userId: userId,
//                 sessionCartId: sessionCartId,
//                 items: [item],
//                 ...calcPrice([item])
//             })
//             await prisma.cart.create({
//                 data: newCart,
//             });

//             // Revalidate product page
//             revalidatePath(`/product/${product.slug}`);
//             return {
//                 success: true,
//                 message: ``,
//             };
//         } else {
//             //Check if the item is already in the cart
//             const itemExists = (cart.items as CartItem[]).find(x => x.productId === item.productId);
//             if (itemExists) {
//                 if (itemExists.qty + 1 > product.stock) {
//                     throw new Error(`Only ${product.stock - itemExists.qty} items left in stock`);
//                 }
//                 (cart.items as CartItem[]).find(x => x.productId === item.productId)!.qty = itemExists.qty + 1;
//             } else {
//                 //If Items are not in the cart
//                 //Check Stock
//                 if (product.stock < 1) {
//                     throw new Error(`OUT OF STOCK!!, sorry.`);
//                 }
//                 (cart.items as CartItem[]).push(item);
//             }

//             //Update the cart/db
//             await prisma.cart.update({
//                 where: { id: cart.id },
//                 data: {
//                     items: cart.items as Prisma.CartUpdateitemsInput[],
//                     ...calcPrice(cart.items as CartItem[])
//                 }
//             });
//             // Revalidate product page
//             revalidatePath(`/product/${product.slug}`);
//             return {
//                 success: true,
//                 message: `${itemExists ? 'Updated in ' : 'added to the'} cart`,
//             };
//         }

//     } catch (error) {
//         return {
//             success: false,
//             message: formatError(error),
//         };
//     }
// };

//Add Items to the Cart
// This function will take in a variable called data of type CartItem as its shape


// export async function getMyCart() {
//     const sessionCartId = (await cookies()).get('sessionCartId')?.value;
//     if (!sessionCartId) {
//         throw new Error('Session cart id not found');
//     }
//     //Get Seesion cart id as well as user id
//     const session = await auth();
//     //Get the user id from the session and display undefined instead of an error if it isnt found
//     const userId = session?.user?.id ? (session.user.id as string) : undefined;

//     //Get Cart items from the database
//     const cart = await prisma.cart.findFirst({
//         where: userId ? { userId: userId } : { sessionCartId: sessionCartId },

//     })
//     if (!cart) return undefined

//     return prismaToJSObject({
//         ...cart,
//         items: cart.items as CartItem[],
//         itemsPrice: Number(cart.itemsPrice),  // Convert to number
//         totalPrice: Number(cart.totalPrice),  // Convert to number
//         shippingPrice: Number(cart.shippingPrice),  // Convert to number
//         taxPrice: Number(cart.taxPrice),  // Convert to number
//     })

// }

// export async function removeItemFromCart(productId: string) {
//     try {
//         const sessionCartId = (await cookies()).get('sessionCartId')?.value;
//         if (!sessionCartId) throw new Error('Cart Session not found');

//         const product = await prisma.product.findFirst({
//             where: { id: productId },
//         });
//         if (!product) throw new Error('Product not found');

//         const cart = await getMyCart();
//         if (!cart) throw new Error('Cart not found');
//         const exist = (cart.items as CartItem[]).find((x) => x.productId === productId);
//         if (!exist) throw new Error('Item not found');

//         if (exist.qty === 1) {
//             // Remove item from cart
//             cart.items = (cart.items as CartItem[]).filter(
//                 (x) => x.productId !== exist.productId
//             );
//         } else {
//             // Decrease quantity of existing item
//             (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty =
//                 exist.qty - 1;
//         }
//         await prisma.cart.update({
//             where: { id: cart.id },
//             data: {
//                 items: cart.items as Prisma.CartUpdateitemsInput[],
//                 ...calcPrice(cart.items as CartItem[]),
//             },
//         });
//         revalidatePath(`/product/${product.slug}`);
//         return {
//             success: true,
//             message: `${product.name}  ${(cart.items as CartItem[]).find((x) => x.productId === productId)
//                 ? 'updated in'
//                 : 'removed from'
//                 } cart successfully`,
//         };

//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// };

//Function to empty the cart
// export async function deleteCart() {
//     try {
//         const sessionCartId = (await cookies()).get('sessionCartId')?.value;
//         if (!sessionCartId) throw new Error('Cart Session not found');
//         console.log(sessionCartId)
//         const cartItems = await getMyCart();
//         console.log('Cart Items:', cartItems);
//         // Get the session Id
//         const session = await auth();
//         console.log(session?.user?.id)

//         await prisma.cart.delete({
//             where: { id: cartItems?.id },
//         });

//         // Optionally clear the cart session
//         (await cookies()).delete('sessionCartId');

//         // Revalidate any relevant paths (e.g., cart page)
//         revalidatePath('/cart');

//         return {
//             success: true,
//             message: 'Cart deleted successfully',
//         };
//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }

// export async function applyDiscount(items: CartItem[], discountRate: number, minAmount: number) {
//     if (discountRate < 0 || discountRate > 100) {
//         throw new Error("Discount rate must be between 0 and 100");
//     }

//     const totalPrice = items.reduce((acc, item) => acc + item.price * item.qty, 0);

//     // Apply discount only if total price exceeds minAmount
//     if (totalPrice >= minAmount) {
//         const discountFactor = 1 - discountRate / 100;
//         return items.map(item => ({
//             ...item,
//             price: parseFloat((item.price * discountFactor).toFixed(2)),
//         }));
//     }

//     return items; // Return original prices if criteria not met
// }

// lib/actions/cart.actions.ts
// export async function updateCartShippingPrice(shippingPrice: number) {
//     try {
//         const session = await auth();
//         if (!session?.user?.id) throw new Error("Unauthorized");

//         const user = await getUserById(session.user.id);
//         if (!user) throw new Error("User not found");

//         const cart = await prisma.cart.findFirst({
//             where: { userId: user.id },
//         });

//         if (!cart) throw new Error("Cart not found");

//         const updatedCart = await prisma.cart.update({
//             where: { id: cart.id },
//             data: { shippingPrice },
//         });

//         return { success: true, data: prismaToJSObject(updatedCart) };
//     } catch (error) {
//         console.error("Error updating cart shipping price:", error);
//         return { success: false, message: (error instanceof Error ? error.message : "Failed to update shipping price") };
//     }
// }
