
package fasta.ioNew;

import utils.ioNew.EGeneIdentifier;
import utils.ioNew.Utils;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.LinkedHashMap;

/**
 * Reads a multiple FASTA file containing DNA sequences in FASTA format
 * and stores the entries as FASTAEntry objects.
 * 
 * @author Alexander Herbig
 * @author Sven Fillinger
 *
 */
public class FASTAParser
{

	public static LinkedHashMap<String, String> geneBankToRefSeqMap;

 	public static LinkedHashMap<String, String> refSeqToGeneBankMap;
	/**
	 * Reads a multiple FASTA file containing DNA sequences in FASTA format.
	 * @param filename the String which represents the FASTA file
	 * @param identifier The type of identifier used
	 * @param settings An boolean array with optional on/off settings
	 * @return	a list containing the resulting FASTAEntry objects
	 * @throws FASTAParserException Throws an exception if the FASTA file could not be opened
	 */
/*	public static LinkedHashMap<String,String> parseDNA(String filename, EGeneIdentifier identifier, boolean... settings) throws FASTAParserException{

		geneBankToRefSeqMap = new LinkedHashMap<>();
		refSeqToGeneBankMap = new LinkedHashMap<>();

		LinkedHashMap<String,String> fastaEntries = new LinkedHashMap<>();

		try(BufferedReader br = new BufferedReader(new FileReader(filename))){

			String tmpID;
			StringBuffer tmpSeqString = new StringBuffer();
			String tmpLine = br.readLine();

			//jump to first header line
			while(tmpLine!=null&&(tmpLine.charAt(0)!='>' || tmpLine.length()==0))
			{
				tmpLine=br.readLine();
			}
			tmpID=tmpLine;

			tmpLine=br.readLine();
			while(tmpLine!=null)
			{
				if(tmpLine.length()!=0)
				{
					if(tmpLine.charAt(0)=='>')
					{
					
					Check, if parser shall use the GI as id, or the hole header
					 
						if(settings.length != 0 && settings[0] && Utils.getSeqID(tmpID.substring(1), identifier) != null){
							// Get the GI
							fastaEntries.put(Utils.getSeqID(tmpID.substring(1), identifier), tmpSeqString.toString());
						} else {
							// Get the hole header
							fastaEntries.put(toID(tmpID), tmpSeqString.toString());
						}

						tmpSeqString = new StringBuffer();

						tmpID = tmpLine;
					}
					else
					{
						tmpSeqString.append(tmpLine);
					}
				}
				tmpLine = br.readLine();
			}

			if(settings.length != 0 && settings[0]){
				fastaEntries.put(Utils.getSeqID(tmpID.substring(1), identifier), tmpSeqString.toString());
			} else{
				fastaEntries.put(toID(tmpID), tmpSeqString.toString());
			}

		} catch (IOException e){
			throw new FASTAParserException("Could open FASTA file.", e);
		}

		return fastaEntries;
	}*/
	
	public static LinkedHashMap<String,String> parseDNANew(String filename, String identifier, boolean... settings) throws FASTAParserException{

		geneBankToRefSeqMap = new LinkedHashMap<>();
		refSeqToGeneBankMap = new LinkedHashMap<>();

		LinkedHashMap<String,String> fastaEntries = new LinkedHashMap<>();

		try(BufferedReader br = new BufferedReader(new FileReader(filename))){

			String tmpID;
			StringBuffer tmpSeqString = new StringBuffer();
			String tmpLine = br.readLine();

			//jump to first header line
			while(tmpLine!=null&&(tmpLine.charAt(0)!='>' || tmpLine.length()==0))
			{
				tmpLine=br.readLine();
			}
			tmpID=tmpLine;

			tmpLine=br.readLine();
			while(tmpLine!=null)
			{
				if(tmpLine.length()!=0)
				{
					if(tmpLine.charAt(0)=='>')
					{
					/*
					Check, if parser shall use the GI as id, or the hole header
					 */
						//System.out.println("parseDNA: " + toID(tmpID));
						/*if(settings.length != 0 && settings[0] && Utils.getSeqIDNew(tmpID.substring(1), identifier) != null){
							// Get the GI
							fastaEntries.put(Utils.getSeqIDNew(tmpID.substring(1), identifier), tmpSeqString.toString());
						} else {*/
							// Get the hole header
							fastaEntries.put(toID(tmpID), tmpSeqString.toString());
							//System.out.println("tempID " + toID(tmpID));
						//}

						tmpSeqString = new StringBuffer();

						tmpID = tmpLine;
					}
					else
					{
						tmpSeqString.append(tmpLine);
					}
				}
				tmpLine = br.readLine();
			}

			/*if(settings.length != 0 && settings[0]){
				fastaEntries.put(Utils.getSeqIDNew(tmpID.substring(1), identifier), tmpSeqString.toString());
			} else{*/
				fastaEntries.put(toID(tmpID), tmpSeqString.toString());
			//}

		} catch (IOException e){
			throw new FASTAParserException("Could open FASTA file.", e);
		}

		return fastaEntries;
	}
	
	private static String toID(String fastaID)
	{
		return(fastaID.substring(1).split(" ")[0]);
	}


}
