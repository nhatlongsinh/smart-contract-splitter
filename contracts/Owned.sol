pragma solidity >=0.4.21 <0.6.0;

contract Owned {
  // owner
  address _owner;

  // event
  event ChangeOwnerEvent(
    address indexed oldOwner,
    address indexed newOwner
  );

  // constructor
  constructor() public {
    _owner = msg.sender;

    emit ChangeOwnerEvent(address(0x0), _owner);
  }

  // modifier
  modifier ownerOnly() {
    require(_owner == msg.sender);
    _;
  }

  // change owner
  function changeOwner(address newOwner)
    public
    ownerOnly
  {
    require(_owner != newOwner && newOwner != address(0x0));
    _owner = newOwner;
    emit ChangeOwnerEvent(msg.sender, _owner);
  }
}