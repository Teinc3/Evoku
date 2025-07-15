/**
 * Example demonstrating how to use the packet factory function approach.
 * This provides a type-safe, ergonomic way to create packets with minimal boilerplate.
 */

import createPacket from "@shared/networking/factory/createPacket";
import createPacketCodec from "@shared/networking/factory/createPacketCodec";
import Networking from "@shared/types/enums/networking";
import { IntCodec, StringCodec, BoolCodec } from "@shared/networking/codecs/primitive/";

import type IDataContract from "@shared/types/contracts/base/IDataContract";


// Example 1: Simple packet with just one field
interface SimpleContract extends IDataContract {
  action: Networking.PING;
  value: number;
}

const SimplePacket = createPacket<SimpleContract>(Networking.PING, {
  value: IntCodec
});

// Example 2: Complex packet with multiple fields
interface ComplexContract extends IDataContract {
  action: Networking.PONG; // You can reuse action types for examples
  userId: number;
  username: string;
  isOnline: boolean;
}

const ComplexPacket = createPacket<ComplexContract>(Networking.PONG, {
  userId: IntCodec,
  username: StringCodec,
  isOnline: BoolCodec
});


// Usage examples:
export function demonstrateUsage() {

  // Create packet instances
  // Can feed data directly into constructor
  const simplePacket = new SimplePacket({ action: Networking.PING, value: 42 });
  simplePacket

  const complexPacket = new ComplexPacket();
  // Can also be fed into .data directly
  complexPacket.data = {
    action: Networking.PONG,
    userId: 123,
    username: "alice",
    isOnline: true
  }

  // Accessing packet properties
  console.log("Simple packet action:", simplePacket.id); // Networking.PING
  console.log("Simple packet value:", simplePacket.data.value); // 42

  console.log("Complex packet action:", complexPacket.id); // Networking.PONG
  console.log("Complex packet username:", complexPacket.data.username); // "alice"

  // Access codec classes using prototype (as they are static properties)
  const SimpleCodec = SimplePacket.prototype.Codec;
  const ComplexCodec = ComplexPacket.prototype.Codec;

  // You can also create independent, reusable codecs if needed
  const IndependentCodec = createPacketCodec<SimpleContract>({
    value: IntCodec
  });

  return {
    simplePacket,
    complexPacket,
    SimpleCodec,
    ComplexCodec,
    IndependentCodec
  };
}


/**
 * Type-safe usage: TypeScript will enforce the contract
 * 
 * Uncomment erroneous lines to see compile-time errors
 */
export function demonstrateTypeSafety() {

  // ✅ This works - all required fields provided
  const validPacket = new SimplePacket({ action: Networking.PING, value: 123 });

  // ❌ This would cause a compile error - missing required field
  // Error: Type '{}' is missing the following properties from type 'SimpleContract': action, value
  // const invalidPacket = new SimplePacket({});

  // ❌ This would cause a compile error - wrong action type
  // Error: Type 'Networking.PONG' is not assignable to type 'Networking.PING'
  // const wrongActionPacket = new SimplePacket({ action: Networking.PONG, value: 123 });

  // ❌ This would cause a compile error - wrong value type
  // Error: Type 'string' is not assignable to type 'number'
  // const wrongTypePacket = new SimplePacket({ action: Networking.PING, value: "not a number" });

  // ✅ Type inference works correctly
  const value = validPacket.data.value; // TypeScript knows this is a number

  return validPacket;
}

export { SimplePacket, ComplexPacket };
