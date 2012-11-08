package com.tapjoy;

/**
 * Flags used in {@link TapjoyConnect#requestTapjoyConnect}
 */
public class TapjoyConnectFlag
{
	/**
	 * Default settings.
	 */
	public static final int NONE						= 0;
	
	/**
	 * Sends the SHA2 hash of UDID/deviceID (IMEI/MEID/serial) in sha2_udid parameter instead of the udid parameter.
	 * <b>Can only be used in the advertiser/connect SDK.</b>
	 */
	public static final int SHA2_UDID					= 1;		
}
