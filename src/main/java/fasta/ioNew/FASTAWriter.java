
package fasta.ioNew;

import java.io.BufferedWriter;

/**
 * Writes a list of sequences to a file in FASTA format.
 * 
 * @author Alexander Herbig
 *
 */
public class FASTAWriter 
{
	/**
	 * Writes a sequence and its id in FASTA format
	 * @param bw the BufferedWriter for the file
	 * @param genomeID the genome id
	 * @param sequence the sequence
	 * @throws Exception Throws an Exception, if the file cannot be written into
     */
	public static void write(BufferedWriter bw, String genomeID, String sequence) throws Exception
	{	
		int charsInLine;
		String tmpSeqString;
		
		tmpSeqString=sequence;
		bw.write(">"+genomeID);
		bw.newLine();
		
		charsInLine=0;
		for(int i=0; i<tmpSeqString.length();i++)
		{
			bw.write(tmpSeqString.charAt(i));
			charsInLine++;
			
			if(charsInLine==60)
			{
				bw.newLine();
				charsInLine=0;
			}
		}
		if(charsInLine!=0)
		{
			bw.newLine();
		}
		
		bw.flush();
	}
}
