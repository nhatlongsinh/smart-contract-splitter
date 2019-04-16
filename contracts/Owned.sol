pragma solidity >=0.4.21 <0.6.0;
contract Owned{
  // owner
  address _owner;

  // event
  event changeOwnerEvent(address oldOwner, address newOwner);

  // constructor
  constructor() public{
    _owner=msg.sender;
  }

  // modifier
  modifier ownerOnly(){
    require(_owner==msg.sender);
    _;
  }

  // change owner
  function changeOwner(address newOwner) public ownerOnly{
    require(newOwner!=address(0x0));
    address oldOwner=_owner;
    _owner=newOwner;
    emit changeOwnerEvent(oldOwner,newOwner);
  }
}